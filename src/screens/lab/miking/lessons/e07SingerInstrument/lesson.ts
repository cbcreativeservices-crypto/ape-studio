/**
 * E07 SINGER WITH GUITAR OR PIANO — the lesson's pages as DATA (blueprint
 * §7). The words come from the owner's lesson (docs/labs/miking/source_text/
 * Singer-With-Guitar-or-Piano-Miking-Technique.txt, cited "L<n>" in COMMENTS
 * only) with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (E7-01
 * … E7-06) applied — the 3:1 example rewritten with its own distances
 * (L14: the mics at least 3 × the farther one's distance apart, computed
 * from the drawing) and "ring out" replaced by the no-provocation rule
 * (L41: bring the level up only to the agreed level; at any ring lower that
 * send at once).
 *
 * Two hosts, one lesson (WITH: GUITAR / GRAND PIANO): the guitar family's
 * seated player and the piano lesson's grand and pianist, the singer's mouth
 * added as a frame-V anchor (geometry.ts).
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { threeToOneRatio } from '../../engine/physics/levels.ts';
import { E07_MODEL, E07_ZONES } from './model.ts';
import { E07_COPY, GUITAR_SOURCE } from './copy.ts';
import { GUITAR_SC, V_GUITAR } from './geometry.ts';

const W: Words = { noun: 'vocal', player: 'performer', moving: 'the hands, the strumming arm, the pedals and the head' };

/* ── the 3:1 numbers, from the drawing (E7-01: the lesson's L14 example rewritten) ── */
const zoneById = (id: string) => E07_ZONES.find((z) => z.id === id)!;
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const VOX = zoneById('sg.voice').start.p;
const GTR = zoneById('sg.fret12.guitar').start.p;
/** The vocal mic's distance from the lips, the guitar mic's from its 12th-fret point, and the two mics apart (mm). */
export const E07_PAIR = {
  rVoice: dist(VOX, V_GUITAR.lip),
  rGuitar: GTR.z - GUITAR_SC.at.fret12.z,
  apart: dist(VOX, GTR),
};
export const E07_RATIO = threeToOneRatio(E07_PAIR.apart, E07_PAIR.rVoice, E07_PAIR.rGuitar);
const cm = (mm: number) => Math.round(mm / 10);
const NEED = 3 * Math.max(E07_PAIR.rVoice, E07_PAIR.rGuitar);
const THREE_TO_ONE = `3:1 asks for the two mics to be at least three times the farther mic’s distance apart. Here the vocal mic is about ${cm(E07_PAIR.rVoice)} cm from the lips and the guitar mic about ${cm(E07_PAIR.rGuitar)} cm from the guitar, so 3:1 would want them about ${cm(NEED)} cm apart — they are about ${cm(E07_PAIR.apart)} cm (${E07_RATIO.toFixed(1)} : 1). A seated singer-guitarist usually cannot give that much space: accept some bleed, aim each mic’s rejection at the other source, or choose one mic.`;

const pages: LessonPages = {
  instrument: {
    title: 'Meet the performer',
    goal: 'Get to know the singer and the instrument as one system — where each sound is made and where it leaves: the mouth, the guitar’s top and sound hole, the piano’s strings and soundboard — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves the mouth; the guitar’s sound leaves its top and its sound hole; the piano’s leaves its strings and soundboard, up under the lid. They are a few tens of centimetres apart — every mic hears both.',
  },
  sound: {
    title: 'Where the sounds come from',
    goal: 'See where the voice leaves the singer and what comes with it, and where the instrument’s sound leaves — and why a mic on one always hears the other. Shown, never played.',
    credit: { scenarios: ['sw.snd.1', 'sw.snd.2', 'sw.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Two sources a few tens of centimetres apart: every mic hears both. Which way each mic’s rejection points decides how much of the other source it takes — and the pair, summed, needs a mono check.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Decide between one coherent mic and separate paths; know the mic, pickup and line-out choices, what the stands keep clear of, and what to settle before any mic goes up.',
    credit: { scenarios: ['sw.set.1', 'sw.set.2', 'sw.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Choose the relationship before the mics: one performance, or two controllable sources. Live, the most stable instrument path — a pickup, a DI, a line out — comes first. Nothing in the performer’s way, and hearing first.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose a vocal mic and an instrument path by their properties — pattern, power, the level they can take, a pickup or a line out — for this performer and this room.',
    credit: { scenarios: ['sw.mic.1', 'sw.mic.2', 'sw.mic.3', 'sw.mic.4', 'sw.rec.1'], note: 'Answer the five checks (one reaches back to where the sounds come from).' },
    takeaway: 'A directional vocal mic with its rejection toward the instrument; a small condenser 15–30 cm from the guitar, or the piano’s mics over its strings; a pickup, DI or line out where stability matters most. One coherent mic is a choice too.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — the vocal mic about 15 cm from the lips, its rejection toward the instrument — then move the mics and see what each hears, and how far apart they are.',
    credit: { scenarios: ['sw.place.1', 'sw.place.2', 'sw.place.3', 'sw.rec.2'], interactive: 'twoZones', note: 'Rest a mic, clear of the performer and the instrument, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Each mic is measured from its own source. With a singer behind an instrument the mics end up close together — some bleed is normal; the rejection, the spacing and a mono check decide how much the music can take.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the vocal mic so its rejection faces the guitar — and know why a coherent studio take and a live show with monitors need different choices.',
    credit: { scenarios: ['sw.ctx.1', 'sw.ctx.2', 'sw.ctx.studio', 'sw.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt or turn the vocal mic (or change its pattern) until the guitar sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'The instrument sits close to a vocal mic, often square below it: tilt and pattern decide how much of it the mic hears. Real nulls are shallower than the picture. Live: the most stable instrument path first, a stable margin, never chasing feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a vocal mic and an instrument mic can sound thin or hollow together — each hears the other source a little later — how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['sw.two.1', 'sw.two.2', 'sw.two.3', 'sw.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Correlated bleed: each mic hears the other source late, so the sum combs. Change the spacing or angle, or turn one down, before a polarity switch — it flips the sign and never removes a delay. Check in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the geometry first — which way each mic points, how far apart they are, the performer’s posture, the monitor’s place — before EQ, a notch or compression.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a singer-with-instrument capture in the right order, choose and justify a setup for a studio take and a live show, and say what would justify a third path.',
    credit: { scenarios: ['sw.prac.order', 'sw.prac.gain', 'sw.prac.setup1', 'sw.prac.setup2', 'sw.prac.3', 'sw.mix.1', 'sw.mix.2', 'sw.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real performer.' },
    takeaway: 'A chosen relationship (one mic or separate paths), each mic measured from its own source, rejection aimed at the other, clearance for the hands and the pedals, headroom for the loudest chorus, a mono check and a stable live margin pass. More than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: sw.snd.* L6, L10, L19–L25 ·
 * sw.set.* L5–L7, L16, L25 · sw.mic.* L12–L13, L16, L24–L25 · sw.place.*
 * L12–L14, L21 · sw.ctx.* L13, L27–L28, L38–L41 · sw.two.* L14, L33, L85 ·
 * sw.prac.* / sw.mix.* L29–L42, L105–L111.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'sw.snd.1',
    page: 'sound',
    prompt: 'A singer plays guitar. What does a mic aimed at the guitar hear besides the guitar?',
    options: ['The voice too, a little later than the vocal mic', 'Nothing else, as long as it is aimed at the guitar', 'Only the room, not the voice itself directly'],
    correct: 'The voice too, a little later than the vocal mic',
    explain: 'The mouth is a few tens of centimetres above the guitar: its sound reaches the guitar mic too — later and quieter than at the vocal mic. That bleed is part of the sound of two mics on one performer.',
    why: {
      'Nothing else, as long as it is aimed at the guitar': 'Aim reduces the voice; it does not remove it. A pattern is a shape, not a wall.',
      'Only the room, not the voice itself directly': 'The voice reaches the guitar mic directly, as well as through the room.',
    },
  },
  {
    id: 'sw.snd.2',
    page: 'sound',
    prompt: 'Where does most of a grand piano’s sound leave it?',
    options: ['The strings and soundboard, up under the open lid', 'The keys, back toward the pianist’s hands and chest', 'The pedals and the legs, down into the floor'],
    correct: 'The strings and soundboard, up under the open lid',
    explain: 'The hammers strike the strings; the soundboard moves the air, up toward the lid (which throws it out toward the curved side) and down under the piano.',
    why: {
      'The keys, back toward the pianist’s hands and chest': 'The keys and action add their noise, but the sound comes from the strings and the board.',
      'The pedals and the legs, down into the floor': 'Pedal thumps travel into the floor; the music leaves the strings and the board.',
    },
  },
  {
    id: 'sw.snd.3',
    page: 'sound',
    prompt: 'Aiming the guitar mic straight into the sound hole often brings…',
    options: ['More low-mid boom from the body', 'More string detail and less body', 'Less of everything, a quieter guitar'],
    correct: 'More low-mid boom from the body',
    explain: 'The air in the body breathes through the hole: straight into it the low-mid builds up. Toward the 12th fret or the bridge tends to be more balanced — a tendency to check by ear.',
    why: {
      'More string detail and less body': 'That is closer to what moving toward the 12th fret does.',
      'Less of everything, a quieter guitar': 'The hole is one of the loudest places on the guitar, low-mid especially.',
    },
  },
  hearingCheck('sw.set.1', W),
  {
    id: 'sw.set.2',
    page: 'setting',
    prompt: 'What do you give up by recording a singer-guitarist on ONE mic?',
    options: ['Changing the voice-to-guitar balance later', 'The sound of the room around the performance', 'The interaction between the voice and guitar'],
    correct: 'Changing the voice-to-guitar balance later',
    explain: 'One mic keeps the performance, the room and the interaction — but the balance is set by where the mic is and how the performer sits. Separate paths give that control back, with bleed and phase to manage.',
    why: {
      'The sound of the room around the performance': 'One mic in a good room keeps the room — often the point of it.',
      'The interaction between the voice and guitar': 'One mic keeps the interaction best of all; it is control that is lost.',
    },
  },
  {
    id: 'sw.set.3',
    page: 'setting',
    prompt: 'Live, a singer plays an acoustic-electric guitar. A stable first path for the guitar?',
    options: ['Its pickup or a DI, a mic added only if it helps', 'A condenser about a metre out in front of the guitar', 'The vocal mic alone, turned up to catch both'],
    correct: 'Its pickup or a DI, a mic added only if it helps',
    explain: 'A pickup or DI is usually more stable against feedback than a distant guitar mic. A mic can add air and detail; blend only after each path works alone, and check polarity and timing in mono.',
    why: {
      'A condenser about a metre out in front of the guitar': 'A distant mic needs a lot of gain on a stage — feedback comes first.',
      'The vocal mic alone, turned up to catch both': 'Turning the vocal mic up raises the stage and brings feedback closer.',
    },
  },
  {
    id: 'sw.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why does a guitar mic hear the singer?',
    options: ['The mouth is a few tens of centimetres above it', 'The guitar’s top passes the voice through itself', 'Only the room carries the voice to the guitar mic'],
    correct: 'The mouth is a few tens of centimetres above it',
    explain: 'Two sources close together: the voice reaches the guitar mic directly, a little later and quieter than at the vocal mic.',
    why: {
      'The guitar’s top passes the voice through itself': 'The voice reaches the mic through the air, directly.',
      'Only the room carries the voice to the guitar mic': 'The direct voice arrives first; the room adds to it.',
    },
  },
  {
    id: 'sw.mic.1',
    page: 'microphone',
    prompt: 'Which pattern choice helps a vocal mic hear less of the guitar below it?',
    options: ['A directional mic, its rejection toward the guitar', 'An omni, so that it hears in all directions evenly', 'Whichever mic, as long as it is turned up louder'],
    correct: 'A directional mic, its rejection toward the guitar',
    explain: 'Orient the vocal mic toward the mouth with its least-sensitive direction toward the guitar — and the guitar mic’s toward the mouth. Check the real pattern and its off-axis tone.',
    why: {
      'An omni, so that it hears in all directions evenly': 'An omni hears the guitar as much as anything else: it rejects nothing.',
      'Whichever mic, as long as it is turned up louder': 'Gain raises the guitar in that mic too.',
    },
  },
  {
    id: 'sw.mic.2',
    page: 'microphone',
    prompt: 'Live, the singer plays a keyboard through its own speaker. What is the instrument’s first path?',
    options: ['A line out or DI; its speaker in the vocal mic’s null', 'A mic in front of its speaker, turned up loud enough', 'The vocal mic, aimed between the voice and the speaker'],
    correct: 'A line out or DI; its speaker in the vocal mic’s null',
    explain: 'A line output or DI gives the most separation and repeatability. Treat the keyboard’s speaker as a source: behind the vocal mic’s rejection where the pattern allows, at the lowest useful level.',
    why: {
      'A mic in front of its speaker, turned up loud enough': 'That adds a mic that also hears the stage; the line is cleaner and more stable.',
      'The vocal mic, aimed between the voice and the speaker': 'Aimed between, the vocal mic hears the speaker fully — put the speaker in its null instead.',
    },
  },
  {
    id: 'sw.mic.3',
    page: 'microphone',
    prompt: 'A figure-8 vocal mic, its side toward the guitar. What can you expect?',
    options: ['Some rejection at the side — check it, not a guarantee', 'Silence from the guitar: a figure-8’s side is deaf', 'More of the guitar, since a figure-8 hears on both its sides'],
    correct: 'Some rejection at the side — check it, not a guarantee',
    explain: 'A figure-8 rejects its sides, but the null is narrow and angle-dependent, and it hears front and back. The guitar is a large source near the mic: check the real pattern by ear.',
    why: {
      'Silence from the guitar: a figure-8’s side is deaf': 'A null is deep only on paper and only at one exact angle.',
      'More of the guitar, since a figure-8 hears on both its sides': 'It hears front and back; its sides are where it rejects.',
    },
  },
  {
    id: 'sw.mic.4',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of these mics will work on the guitar?',
    options: ['An instrument dynamic: it needs no power', 'The small condenser, with a short cable', 'The large condenser, since it is so very big'],
    correct: 'An instrument dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. Both condensers need phantom power.',
    why: {
      'The small condenser, with a short cable': 'Cable length does not power a condenser.',
      'The large condenser, since it is so very big': 'Size does not power a condenser.',
    },
  },
  {
    id: 'sw.place.1',
    page: 'placement',
    prompt: 'The vocal mic and the guitar mic each have a starting distance. What is each measured from?',
    options: ['The lips, and the guitar point its zone names', 'Both of them measured from the guitar’s sound hole', 'Both from the singer’s chest, the middle'],
    correct: 'The lips, and the guitar point its zone names',
    explain: 'Each mic is measured from its own source: the vocal mic from the lips, the guitar mic from the 12th fret or the sound hole.',
    why: {
      'Both of them measured from the guitar’s sound hole': 'The voice does not leave the sound hole: the vocal mic is measured from the lips.',
      'Both from the singer’s chest, the middle': 'Neither sound leaves the chest. Each mic is measured from its own source.',
    },
  },
  {
    id: 'sw.place.2',
    page: 'placement',
    prompt: `The vocal mic is ${cm(E07_PAIR.rVoice)} cm from the lips and the guitar mic about ${cm(E07_PAIR.rGuitar)} cm from the guitar. How far apart does 3:1 want them?`,
    options: [`At least about ${cm(NEED)} cm, three times the farther one`, `At least ${cm(3 * E07_PAIR.rVoice)} cm, three times the vocal mic’s distance`, `About ${cm(E07_PAIR.rVoice + E07_PAIR.rGuitar)} cm, the two distances added together`],
    correct: `At least about ${cm(NEED)} cm, three times the farther one`,
    explain: THREE_TO_ONE,
    why: {
      [`At least ${cm(3 * E07_PAIR.rVoice)} cm, three times the vocal mic’s distance`]: `3:1 uses the farther mic’s distance — here the guitar mic’s ${cm(E07_PAIR.rGuitar)} cm.`,
      [`About ${cm(E07_PAIR.rVoice + E07_PAIR.rGuitar)} cm, the two distances added together`]: '3:1 is a ratio: the spacing is at least three times the farther distance.',
    },
  },
  {
    id: 'sw.place.3',
    page: 'placement',
    prompt: 'A seated singer-guitarist cannot give the mics 3:1 spacing. Is the two-mic setup then wrong?',
    options: ['No — accept some bleed, aim the nulls, or use one mic', 'Yes — two mics need 3:1, or they cannot be used at all', 'Yes — move the guitar mic a metre away to get it'],
    correct: 'No — accept some bleed, aim the nulls, or use one mic',
    explain: '3:1 is a starting design for reducing correlated bleed, not a pass mark. With a performer this close, accept the bleed as part of the performance, aim each mic’s rejection at the other source — or choose one coherent mic.',
    why: {
      'Yes — two mics need 3:1, or they cannot be used at all': 'Many fine recordings break 3:1; it is a guideline, and the mono check decides.',
      'Yes — move the guitar mic a metre away to get it': 'A metre out the guitar mic hears more room and more voice — the opposite of the aim.',
    },
  },
  {
    id: 'sw.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must the stands and booms stay clear of around a singer at the piano?',
    options: ['The pianist’s head and hands, the lid and pedals', 'The audience’s view of the pianist’s face and hands', 'The piano’s finish, so that it is not scratched'],
    correct: 'The pianist’s head and hands, the lid and pedals',
    explain: 'Clearance comes first: a boom keeps the vocal mic clear of the head, the hands and the music desk; nothing goes where the pianist can strike it, or in the way of the pedals, the bench or the way out.',
    why: {
      'The audience’s view of the pianist’s face and hands': 'Sight lines matter, but safety is about the performer and the instrument.',
      'The piano’s finish, so that it is not scratched': 'Care for the piano matters — but the question is what the pianist can hit or trip on.',
    },
  },
  {
    id: 'sw.ctx.1',
    page: 'context',
    prompt: 'Live, the singer-guitarist’s wedge rings as the level comes up. What do you do?',
    options: ['Lower that send at once, then change the geometry', 'Raise it a little more to find the exact ringing note', 'Turn the guitar up so it covers the ringing'],
    correct: 'Lower that send at once, then change the geometry',
    explain: 'Bring the level up only to the agreed performance level with a stable margin. At any ring, lower that send at once and change the placement, the angle or the pattern. Never raise the level to find the feedback point.',
    why: {
      'Raise it a little more to find the exact ringing note': 'Never provoke feedback: it is loud, it is unsafe, and it is not a measurement.',
      'Turn the guitar up so it covers the ringing': 'More level feeds the loop. Lower the send first.',
    },
  },
  superNull('sw.ctx.2', 'context', 'guitar'),
  {
    id: 'sw.ctx.studio',
    page: 'context',
    prompt: 'A singer-guitarist in a quiet, good-sounding studio, a song where the interaction matters most. A fair first idea?',
    options: ['One mic out in front, the balance set by its place', 'A mic inside the sound hole for the most guitar sound', 'Four mics on the guitar, to choose from later'],
    correct: 'One mic out in front, the balance set by its place',
    explain: 'In a good room one coherent mic keeps the interaction and the room — move it until voice and guitar balance, and keep the posture. Two mics are the choice when you need control.',
    why: {
      'A mic inside the sound hole for the most guitar sound': 'Inside the hole is the boomiest place, and nothing goes where the hand plays.',
      'Four mics on the guitar, to choose from later': 'More mics add bleed and phase problems with every one; choose a relationship first.',
    },
  },
  {
    id: 'sw.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which way does a grand piano’s lid throw the sound?',
    options: ['Out toward its open, curved side', 'Straight back toward the pianist', 'Down into the floor below it'],
    correct: 'Out toward its open, curved side',
    explain: 'The board sends sound up; the open lid reflects it out toward the curved side — and some goes down under the piano.',
    why: {
      'Straight back toward the pianist': 'The pianist hears it, but the lid throws it out to the curved side.',
      'Down into the floor below it': 'Some sound goes down under the piano; the lid throws the rest out to the side.',
    },
  },
  {
    id: 'sw.two.1',
    page: 'twoMic',
    prompt: 'The vocal and guitar mics, each fine alone, sound thin together in mono. Why?',
    options: ['Each hears the other source a little later', 'The guitar mic reverses the polarity of the voice', 'The vocal mic is louder, so it cancels the guitar'],
    correct: 'Each hears the other source a little later',
    explain: 'Correlated bleed: the guitar mic hears the voice later than the vocal mic does, and the vocal mic hears the guitar later than the guitar mic does. Summed, some pitches cancel — a comb.',
    why: {
      'The guitar mic reverses the polarity of the voice': 'Distance delays a sound; it does not flip its sign.',
      'The vocal mic is louder, so it cancels the guitar': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('sw.two.2'),
  matchedLevels('sw.two.3'),
  {
    id: 'sw.two.4',
    page: 'twoMic',
    prompt: 'A pickup and a guitar mic, blended, sound hollow. What do you check first?',
    options: ['Each alone, then polarity and timing in mono', 'More of both, so the hollow fills itself in', 'A different pickup, since the first is wrong'],
    correct: 'Each alone, then polarity and timing in mono',
    explain: 'Blend only after each path works alone; then compare polarity and timing in mono — a pickup’s path arrives at a different time from the mic’s.',
    why: {
      'More of both, so the hollow fills itself in': 'Level cannot undo a cancellation between the paths.',
      'A different pickup, since the first is wrong': 'The pickup may be fine: the combination needs checking first.',
    },
  },
  {
    id: 'sw.prac.gain',
    page: 'practice',
    prompt: 'The verses sit well below the overload light, but the loudest chorus lights it. What do you do?',
    options: ['Lower the input gain, then re-check the chorus', 'Pull the channel fader down until it sounds clean', 'Ask the performer to play the chorus more softly'],
    correct: 'Lower the input gain, then re-check the chorus',
    explain: 'Set gain from the loudest vocal and instrument passages and leave conservative headroom; record a short test before the full take. The fader comes after the overload.',
    why: {
      'Pull the channel fader down until it sounds clean': 'The overload happens at the input, before the fader.',
      'Ask the performer to play the chorus more softly': 'The chorus is the performance. Set the gain for it.',
    },
  },
  {
    id: 'sw.prac.3',
    page: 'practice',
    prompt: 'What would justify adding the guitar’s pickup to a vocal mic and a guitar mic?',
    options: ['It adds control or stability, and mono still holds', 'More channels give the mix more options to choose from', 'The guitar needs more level than one mic gives'],
    correct: 'It adds control or stability, and mono still holds',
    explain: 'Capture the pickup when it adds useful control — live, often stability against feedback. Blend only after checking polarity, timing and feedback; otherwise leave it out.',
    why: {
      'More channels give the mix more options to choose from': 'Each path adds a combining check; it must earn its place.',
      'The guitar needs more level than one mic gives': 'Level comes from gain, not from another path.',
    },
  },
  {
    id: 'sw.mix.1',
    page: 'practice',
    prompt: 'The guitar mic hears too much voice. What is the first change to try?',
    options: ['Turn its rejection toward the mouth, or move it', 'Turn the vocal channel down so as to hide the voice', 'Add a high cut until the voice is gone'],
    correct: 'Turn its rejection toward the mouth, or move it',
    explain: 'Aim the guitar mic at the guitar’s useful radiation with its least-sensitive side toward the mouth, or change its place or pattern — then check the combined sound.',
    why: {
      'Turn the vocal channel down so as to hide the voice': 'The voice is still in the guitar mic; turning the vocal down changes the balance, not the bleed.',
      'Add a high cut until the voice is gone': 'A cut dulls the guitar as much as the voice.',
    },
  },
  nullOnPaper('sw.mix.2', 'guitar'),
  removeDelay('sw.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'sw.sym.vocalGtr',
    observation: 'The vocal mic contains too much guitar',
    firstChecks: 'Does the vocal mic point toward the guitar, or is it too far from the mouth? Move closer, aim its rejection at the guitar, change the angle — or accept a unified sound.',
    options: ['Move closer; aim its rejection at the guitar', 'Turn the guitar mic up to mask the bleed', 'Use an omni vocal mic to even the two sources out'],
    correct: 'Move closer; aim its rejection at the guitar',
    explain: 'Closer to the mouth the voice wins; turned so its least-sensitive side faces the guitar, the mic hears less of it. If it cannot be separated, a unified approach may be the answer.',
    why: {
      'Turn the guitar mic up to mask the bleed': 'More guitar mic adds more guitar — and more voice from it too.',
      'Use an omni vocal mic to even the two sources out': 'An omni hears the guitar fully: it rejects nothing.',
    },
  },
  {
    id: 'sw.sym.thin',
    observation: 'The two tracks sound thin or hollow together',
    firstChecks: 'Correlated bleed and the timing difference. Change the spacing or angle, turn one down, and check mono before processing.',
    options: ['Change spacing or angle; check mono first', 'Flip one mic’s polarity and leave it like that', 'Add low end to both until it fills out'],
    correct: 'Change spacing or angle; check mono first',
    explain: 'Each mic hears the other source late; summed, some pitches cancel. Move or rebalance first — a polarity switch cannot align every pitch.',
    why: {
      'Flip one mic’s polarity and leave it like that': 'Polarity is a check, not a cure: it cannot remove a delay.',
      'Add low end to both until it fills out': 'EQ cannot undo a cancellation between paths.',
    },
  },
  {
    id: 'sw.sym.gtrFeedback',
    observation: 'The acoustic guitar feeds back on stage',
    firstChecks: 'A distant condenser, a monitor on its axis, a resonant body? Use the pickup or DI, move the monitor, reduce stage level — and notch only after placement.',
    options: ['Pickup or DI, move the monitor, less stage level', 'Turn the guitar mic up past the ringing', 'Aim the guitar mic straight at the wedge instead'],
    correct: 'Pickup or DI, move the monitor, less stage level',
    explain: 'A pickup or DI is more stable than a distant mic; keep the instrument mic off the monitor’s axis and lower the stage level. Never raise the level to find the feedback point.',
    why: {
      'Turn the guitar mic up past the ringing': 'More gain feeds the loop.',
      'Aim the guitar mic straight at the wedge instead': 'That is the most sensitive direction for the wedge — the opposite of what helps.',
    },
  },
  {
    id: 'sw.sym.pianoBoom',
    observation: 'The piano is boomy under the vocal',
    firstChecks: 'A mic too close to the bass strings or the soundboard? Move toward the treble or the centre, adjust the lid, or use a controlled low cut.',
    options: ['Move toward the centre or treble; adjust the lid', 'Boost the vocal’s low end so the two match', 'Put another mic under the piano to balance the bass'],
    correct: 'Move toward the centre or treble; adjust the lid',
    explain: 'Close to the bass strings the low end dominates. A move toward the middle or treble, the lid, or a controlled low cut — placement first.',
    why: {
      'Boost the vocal’s low end so the two match': 'That makes the whole mix heavier, not clearer.',
      'Put another mic under the piano to balance the bass': 'Under the piano is boomier still.',
    },
  },
  {
    id: 'sw.sym.posture',
    observation: 'The singer’s tone changes while playing',
    firstChecks: 'Posture, the guitar’s angle or the distance changes. Mark positions, adjust the stand geometry, and rehearse consistent movement.',
    options: ['Mark the positions; rehearse the posture', 'Compress hard until the tone holds still', 'Ask the singer not to move at all'],
    correct: 'Mark the positions; rehearse the posture',
    explain: 'Consistent posture is a tone control: a lean or a turned guitar changes what each mic hears. Mark it and rehearse; compression cannot fix a changing tone.',
    why: {
      'Compress hard until the tone holds still': 'Compression evens the level, not the changing tone and bleed.',
      'Ask the singer not to move at all': 'Movement is part of playing; agree a comfortable, repeatable position.',
    },
  },
  hollowSymptom('sw.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'sw.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a singer-with-guitar setup in the order you would do them.',
    steps: [
      { text: 'Hear the performer without mics; decide one coherent mic or separate paths', early: 'Start with the performer and the relationship you want.' },
      { text: 'Seat the performer; settle the guitar’s angle and the posture', early: 'Settle the performer’s geometry before the mics.' },
      { text: 'Place the vocal mic about 15 cm from the lips, its rejection toward the guitar', early: 'You need the relationship and the posture first.' },
      { text: 'Place the guitar mic or connect the pickup, its rejection toward the mouth', early: 'The vocal mic goes first; then the instrument path.' },
      { text: 'Mute the outputs; then switch phantom on where a mic needs it', early: 'Power comes after the mics are placed and connected.' },
      { text: 'Set gain on the loudest vocal and instrument passages, with headroom', early: 'Gain is set once the mics are connected and powered.' },
      { text: 'Listen to each alone, then the pair in mono', early: 'Check the pair once the levels are set.' },
      { text: 'Secure the stands and cables; record a short test, then the take', early: 'Secure everything last, then test.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: the loudest real passages, with conservative headroom.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'sw.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio: a singer-guitarist, a quiet good room, a delicate song. Phantom power available.',
    setups: [
      { id: 'a', label: 'One condenser out in front, moved until voice and guitar balance', ok: true, power: 'phantom', feedback: 'A recommended idea for a coherent take in a good room — the balance is set by the mic’s place and the posture.' },
      { id: 'b', label: 'A vocal mic ~15 cm from the lips and a guitar mic ~22 cm from the 12th fret, rejection toward each other', ok: true, power: 'phantom', feedback: 'A recommended pair for control — check each alone and the pair in mono.' },
      { id: 'c', label: 'A mic inside the sound hole and a second at the singer’s chest', ok: false, power: 'phantom', feedback: 'Inside the hole is the boomiest place, and neither sound leaves the chest.' },
      { id: 'd', label: 'Four mics on the guitar, chosen later', ok: false, power: 'phantom', feedback: 'Every mic adds bleed and phase; choose a relationship first.' },
      { id: 'e', label: 'An omni vocal mic 5 cm from the lips to block the guitar', ok: false, power: 'phantom', feedback: 'An omni rejects nothing; distance does more than the pattern here.' },
    ],
    reasons: [
      { id: 'r.doc', label: 'Each mic is measured from its own source: the lips, the guitar point', role: 'required', feedback: 'Say what each mic is measured from.' },
      clearReason('the hands, the strumming arm, the neck and the singer’s face'),
      { id: 'r.mono', label: 'The pair is checked alone and in mono', role: 'optional', feedback: 'A fair reason for a two-mic setup.' },
      { id: 'r.power', label: 'The channels give the condensers the phantom power they need', role: 'required', feedback: 'Say how each mic is powered.' },
      BRAND_REASON('voice'),
      LOUD_REASON,
    ],
    explain: 'More than one setup passes. What passes is the reasoning: a chosen relationship, each mic measured from its own source, clearance for the performer, a mono check, and the power each mic needs.',
  },
  {
    id: 'sw.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Live: a singer at a grand piano, a wedge, a PA. Phantom power available.',
    setups: [
      { id: 'a', label: 'A vocal dynamic on a boom, rejection toward the strings; piano mics close over the strings', ok: true, power: 'phantom', feedback: 'A recommended live setup — check the boom’s clearance and the margin before feedback.' },
      { id: 'b', label: 'A vocal dynamic on a boom; the piano’s mics inside the lid, mounted without touching the strings', ok: true, power: 'phantom', feedback: 'Also fair — with the owner’s agreement and nothing near the moving parts.' },
      { id: 'c', label: 'A distant stereo pair on the room for a natural sound', ok: false, power: 'phantom', feedback: 'Distant piano mics need too much gain for reinforcement.' },
      { id: 'd', label: 'A stand right beside the bench, the vocal mic over the keys', ok: false, power: 'none', feedback: 'A stand where the pianist can strike it, or in the way of the bench and the pedals, is the wrong place.' },
      { id: 'e', label: 'Raise the level until it rings, then pull back a little', ok: false, power: 'none', feedback: 'Never provoke feedback: set the agreed level with a stable margin.' },
    ],
    reasons: [
      { id: 'r.doc', label: 'Each mic is measured from its own source: the lips, the strings', role: 'required', feedback: 'Say what each mic is measured from.' },
      clearReason('the pianist’s head and hands, the music desk, the lid, the bench and the pedals'),
      { id: 'r.margin', label: 'A stable margin before feedback, the wedge in the vocal mic’s rejection', role: 'required', feedback: 'Say how the live margin is kept.' },
      { id: 'r.close', label: 'Close piano mics need less gain than distant ones', role: 'optional', feedback: 'A fair live reason.' },
      BRAND_REASON('voice'),
      { id: 'r.loudest', label: 'Turn it up until the piano is louder than the voice', role: 'wrong', feedback: 'Balance is set by the mix and the placement; more gain brings feedback closer.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: close piano mics, a boomed vocal mic with its rejection toward the strings, clearance for the pianist, and a stable live margin.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where is the raw sound of a voice made?', options: ['In the chest', 'At the vocal folds in the throat', 'At the lips'], after: 'Now STEP through (or PLAY ONCE) and watch the breath, the folds, the throat and the mouth.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: the vocal mic is 15 cm from the lips, the guitar mic 22 cm from the guitar. Do they meet 3:1?', options: ['Yes, easily', 'No — they are too close together', 'It depends on the patterns'], after: 'Rest a mic in two zones; the STARTING SETUPS card shows how far apart the pair is.' },
  context: { prompt: 'The guitar is just below the vocal mic. Where will a supercardioid aimed at the mouth reject it best?', options: ['With its front tilted up, the guitar off its rear', 'Level, the guitar at its side', 'Tilted down toward the guitar'], after: 'Now tilt or turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'A singer plays guitar. How many sound sources does each mic hear?',
    options: ['Two: the voice and the guitar, at different times', 'One: only the source that it is aimed at directly', 'None directly: only the room around the two of them'],
    correct: 'Two: the voice and the guitar, at different times',
    explain: 'The mouth and the guitar are a few tens of centimetres apart: every mic hears both, the farther source a little later.',
    why: {
      'One: only the source that it is aimed at directly': 'Aim reduces the other source; it does not remove it.',
      'None directly: only the room around the two of them': 'Both sources reach every mic directly, before the room.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where does most of a grand piano’s sound leave it?',
    options: ['The strings and soundboard, up under the lid', 'The keys, back toward the pianist’s hands and chest', 'The pedals, down into the floor beneath it'],
    correct: 'The strings and soundboard, up under the lid',
    explain: 'The soundboard moves the air, up toward the lid and down under the piano; the lid throws it out to the curved side.',
    why: {
      'The keys, back toward the pianist’s hands and chest': 'The keys add noise; the sound comes from the strings and the board.',
      'The pedals, down into the floor beneath it': 'Pedal thumps go into the floor; the music leaves the strings and the board.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Aiming a guitar mic straight into the sound hole tends to bring…',
    options: ['More low-mid boom', 'More string detail', 'A quieter guitar'],
    correct: 'More low-mid boom',
    explain: 'The air in the body breathes through the hole; straight into it the low-mid builds. Toward the 12th fret is more balanced.',
    why: {
      'More string detail': 'That is nearer the 12th fret.',
      'A quieter guitar': 'The hole is one of the loudest places.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'What do you give up with ONE mic on a singer-guitarist?',
    options: ['Re-balancing voice and guitar later', 'The room sound around the performance', 'The interaction between the two'],
    correct: 'Re-balancing voice and guitar later',
    explain: 'One mic keeps the performance whole; the balance is fixed by where the mic is and how the performer sits.',
    why: {
      'The room sound around the performance': 'One mic in a good room keeps the room.',
      'The interaction between the two': 'One mic keeps the interaction best of all.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must the stands and cables keep clear of around a singer at the piano?',
    options: ['The head, hands, desk, pedals and bench', 'The audience’s view of the performer at the piano', 'The piano’s finish, so it is not marked'],
    correct: 'The head, hands, desk, pedals and bench',
    explain: 'Nothing where the pianist can strike it or trip on it: a boom keeps the vocal mic clear of the head, the hands and the music desk; the stand and cable stay clear of the pedals, the bench and the way out.',
    why: {
      'The audience’s view of the performer at the piano': 'Sight lines matter less than the performer’s movement and safety.',
      'The piano’s finish, so it is not marked': 'Care for the piano matters — the safety question is what the pianist can hit.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'guitar',
    label: 'the guitar, right below the vocal mic',
    short: 'GUITAR',
    p: GUITAR_SOURCE,
    lift: 0,
    faces: { x: 0, y: 0, z: 1 },
    note: 'The guitar’s sound hole, a few tens of centimetres below the vocal mic: a source the vocal mic should reject as much as it can while it still faces the singer.',
    prov: { kind: 'illustrative', reason: 'the guitar family’s sound hole on the singer-guitarist (drawing default); "orient the vocal microphone toward the mouth with its least-sensitive direction toward the guitar" (lesson L13)' },
    glyph: 'none',
  },
  {
    id: 'wedge',
    label: 'the performer’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: GUITAR_SC.fit.head.c.x, y: GUITAR_SC.floorY, z: 1100 },
    lift: 250,
    faces: { x: 0, y: 0, z: -1 },
    note: 'On the floor in front of the performer, facing back: behind the vocal mic, below it — for a cardioid, the place a monitor generally goes.',
    prov: { kind: 'illustrative', reason: 'S-SM58-UG "directly behind it"; the lesson L27; distance a drawing default' },
  },
];

export const E07_LESSON: Lesson = {
  id: 'E07',
  labId: 'ensembles',
  title: 'Singer with Guitar or Piano',
  subtitle: 'One performer, two sources: one coherent mic, or a vocal mic and an instrument mic — each hearing both',
  noun: { one: 'singer with an instrument', many: 'singers with instruments' },
  model: E07_MODEL,
  micTypeIds: ['vocDynCard', 'vocDynSuper', 'vocLdc', 'sdcCard', 'instDynCard', 'vocLdcOpen'],
  zones: E07_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  setupPairs: [{ label: 'The vocal mic and a mic over the middle strings', A: { zone: 'sp.voice' }, B: { zone: 'sp.over' }, variants: ['piano'], line: 'A vocal mic on a boom and one mic over the strings — each hears the other source too. Check the pair together in mono.' }],
  orient: [
    { title: 'WHAT IT IS', text: 'One performer, two sources: a voice — breath, the vocal folds, the throat and the mouth — and an instrument played at the same time, an acoustic guitar held in front of the body or a piano with the singer at its keys.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Singer-songwriters, solo sets, acoustic sessions, a singer at the piano in a bar, a church or a studio — live and recorded.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The voice and the instrument are one performance: the singer shapes both at once, leaning, turning and breathing with the song. The miking has to respect that interaction.', src: 'LESSON' },
    { title: 'ONE SYSTEM', text: 'The performer, the instrument, the room, the movement, the bleed and the monitors form one miking system: the mouth sits a few tens of centimetres above a guitar, and right above a piano’s keys.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — while the hands play.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds buzz in the breath: the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue and the lips shape the buzz into the words of the song.' },
      { title: 'It leaves the mouth', text: 'The voice leaves through the mouth — a few tens of centimetres above the guitar’s top, or right above the piano’s keys. Every mic on the performer hears it.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips, S and T a narrow hiss — at the vocal mic, ahead of the mouth. The guitar’s pick and fingers, and the piano’s hammers, add their own attack from below.',
    body: 'The vowels carry the melody; the guitar’s top and sound hole, or the piano’s board under the lid, carry the instrument’s body. Each mic hears both — the nearer source louder, the other a little later.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'DPA-VOICE' },
  },
  setting: {
    items: [
      { id: 'performer', label: 'the performer', short: 'PERFORMER', note: 'Seated with the guitar, or at the piano: the mouth is where the vocal distances start.', prov: { kind: 'illustrative', reason: 'the host families’ player (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'other', label: 'the other source', short: 'THE OTHER SOURCE', note: 'The guitar or the piano is in every vocal mic; the voice is in every instrument mic. Aim each mic’s rejection at the other source; check the pair in mono.', prov: { kind: 'illustrative', reason: 'the lesson L13, L33' }, tag: 'SPILL', scene: 'all' },
      { id: 'hands', label: 'the hands, the arm, the neck and the pedals', short: 'THE PERFORMER’S SPACE', note: 'Stands and cables stay clear of the strumming arm, the fretting hand, the neck and the headstock; at the piano, of the head, the hands, the music desk, the lid, the pedals, the bench and the way out.', prov: { kind: 'illustrative', reason: 'the lesson L21, L42, L102' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'the wedge', short: 'WEDGE', note: 'For a cardioid vocal mic, a monitor generally goes directly behind it; a supercardioid’s rejection sits a little to one side. Keep the guitar mic off the monitor’s axis.', prov: { kind: 'illustrative', reason: 'the lesson L27–L28' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'One coherent mic, or a distant pair, brings the room in: it suits a quiet, good-sounding room and a stable performer.', prov: { kind: 'illustrative', reason: 'the lesson L10, L19' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a directional vocal mic, the most stable instrument path — a pickup or DI, a line out, close piano mics — the monitor where the vocal mic rejects it, and a stable margin before feedback, never chased.',
    studio: 'STUDIO: decide one coherent mic or separate paths; mark the performer’s position; change one thing at a time; listen to each mic alone, in stereo and in mono.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a singer-guitarist in the studio and for a singer at the piano on stage, describe an alternative, and explain what would justify a pickup or a line out alongside the mics. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'instrument', label: 'Instrument', kind: 'choice', choices: ['acoustic guitar', 'acoustic-electric guitar', 'grand piano', 'upright piano', 'keyboard', 'other'] },
      { id: 'approach', label: 'Approach', kind: 'choice', choices: ['one coherent mic', 'vocal mic + instrument mic', 'vocal mic + pickup or DI', 'vocal mic + line out', 'other'] },
      { id: 'distances', label: 'Each mic’s distance from its source, and how far apart they were', kind: 'text' },
      { id: 'notes', label: 'What you heard, alone and in mono (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The singer-guitarist’s seated posture, the mouth’s place above the guitar, and the pianist on the bench — the host families’ drawing defaults (the research leaves the mouth-to-instrument offset to the owner).', dims: ['yFloor'] },
    { text: 'The one-mic starting point’s distance (40–70 cm from the lips, 20–45° below the mouth’s axis) — a drawing default: the lesson gives no number.', dims: [] },
    { text: 'The guitar and the piano, their mics and their zones: the guitar family’s and the piano lesson’s drawing defaults and sourced rows, unchanged — their keep-out margins (the guitar’s top, bridge and strings; the piano’s strings, dampers and lid) are those families’ illustrative clearances.', dims: ['guitar', 'gp'] },
    { text: 'The 3:1 figures on screen are computed from the drawing (each mic’s distance from its own source and the two mics apart) — the guideline, not a promise of separation.', dims: [] },
    { text: 'The guitar drawn as a point source for the vocal mic’s null, and the wedge’s place — drawing defaults.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every performer, instrument and room is different: move the mics, experiment, and trust your ears. The lab is silent and draws a simplified picture: one seated singer-guitarist and one singer at a grand in typical poses, mic patterns and the two-mic comb as textbook shapes, the guitar as one point for the null exercise; the 3:1 figures are computed from the drawing. Distances are rounded to about 5 mm and measured from each source to the mic’s front. Place real mics with the performer stopped, and open a piano only with its owner’s agreement.',
  copy: E07_COPY,
};
