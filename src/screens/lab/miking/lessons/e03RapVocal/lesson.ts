/**
 * E03 RAP AND RHYTHMIC VOCAL — the lesson's pages as DATA (blueprint §7).
 * The words come from the owner's lesson (docs/labs/miking/source_text/
 * Rap-Rhythmic-Vocal-Miking-Technique.txt, cited "L<n>" in COMMENTS only)
 * with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (E3-01 …
 * E3-06) applied — the table's unsourced "Close dynamic, 2–6 in" now "about
 * 10 cm (4 in), 5–15 cm to rehearse in" (L13), "about 10 dB of headroom
 * (peaks near −10 dBFS)" (L34), the aim "between the nose and the mouth"
 * sourced (L59).
 *
 * An E01 variant on the shared voice family (frame V), with the rapper's
 * WORKING ZONE (a drawing default) and the level swing it causes (the
 * inverse-square law, a free-field estimate).
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { E03_MODEL } from './geometry.ts';
import { E03_ZONES } from './model.ts';
import { E03_COPY } from './copy.ts';

const W: Words = { noun: 'vocal', player: 'performer', moving: 'the head, the hands and the feet' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the voice',
    goal: 'Get to know the voice as a rapper uses it — where its sound is made, how it is shaped into fast consonants, and where it leaves — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Breath sets the vocal folds buzzing; the throat, the tongue, the teeth and the lips shape it into words; it leaves through the mouth — with a puff of air on every P and B.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See how breath becomes a voice and where it leaves — and what fast, consonant-heavy delivery sends out with it: repeated puffs of air and sharp hiss along the mouth’s axis.',
    credit: { scenarios: ['rp.snd.1', 'rp.snd.2', 'rp.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'The voice leaves through the mouth, so every distance is read from the lips. A fast verse sends puff after puff and hiss after hiss straight out along the mouth’s axis — a screen, a grille, a little angle or a little distance keeps them off a capsule.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know what else reaches a rap vocal mic — the headphones, the room, the wedge and the beat — the working zone the performer moves in, and what to settle before any mic goes up.',
    credit: { scenarios: ['rp.set.1', 'rp.set.2', 'rp.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Hear the real verse, ad-libs and hook first. Agree a working zone; do not chase the performer with the mic. Closed-back headphones in the studio, the wedge in the pattern’s null on stage — and hearing first.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for rap by its properties — pattern, power, the level it can take, a grille or a screen — and by the performer and the production, not by a genre rule or a brand.',
    credit: { scenarios: ['rp.mic.1', 'rp.mic.2', 'rp.mic.3', 'rp.mic.4', 'rp.rec.1'], note: 'Answer the five checks (one reaches back to where the voice comes from).' },
    takeaway: 'A dynamic is a frequent first choice for aggressive delivery; a screened condenser can open the consonants; a headset holds one distance for a moving performer. A starting hypothesis, not a genre rule — audition the real verse.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a dynamic about 10 cm from the lips in the studio, a handheld within about 10 cm on stage — then move the mic and see what changes, and how much a lean inside the working zone moves the level.',
    credit: { scenarios: ['rp.place.1', 'rp.place.2', 'rp.place.3', 'rp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the performer, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips. Close up, a small lean is a big level change — a rehearsed working zone keeps the verse steady. Clearance from the face comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the handheld so its pattern’s rejection faces the performer’s wedge — and know why a dry studio verse and a loud stage need different choices.',
    credit: { scenarios: ['rp.ctx.1', 'rp.ctx.2', 'rp.ctx.studio', 'rp.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of its rear. The wedge sits below a level mic — tilt and pattern both matter. Never cover the grille, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one voice can sound thin together, how the arrival-time difference places comb notches, and why a doubled or layered take checks mono before it is widened.',
    credit: { scenarios: ['rp.two.1', 'rp.two.2', 'rp.two.3', 'rp.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the voice at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Check layered takes in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance, the working zone, the angle to the mouth, the screen, the grille, the wedge, the gain — before reaching for a severe low cut or compression.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a rap vocal mic in the right order, choose and justify a setup for a studio verse and a live show, and say what would justify a second mic.',
    credit: { scenarios: ['rp.prac.order', 'rp.prac.gain', 'rp.prac.setup1', 'rp.prac.setup2', 'rp.prac.3', 'rp.mix.1', 'rp.mix.2', 'rp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real performer.' },
    takeaway: 'Distance from the lips, a rehearsed working zone, clearance from the face, headroom for the loudest ad-lib, pattern reasoning and polarity versus delay pass. A genre rule or a brand do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: rp.snd.* L30–L31 · rp.set.* L5–L7,
 * L29, L76 · rp.mic.* L6, L9, L39, L43–L44 · rp.place.* L29, L36 · rp.ctx.*
 * L37, L42–L43 · rp.two.* L40, L80 · rp.prac.* / rp.mix.* L33–L35, L78–L82.
 */
const swing = (near: number, far: number) => Math.round(20 * Math.log10(far / near));
const scenarios: MikingScenario[] = [
  {
    id: 'rp.snd.1',
    page: 'sound',
    prompt: 'A fast verse is full of P, B, T and K. What does that send toward a mic in front of the lips?',
    options: ['Repeated puffs of air along the mouth’s axis', 'Nothing more than a slow verse would send', 'Air sideways out of the corners of the mouth'],
    correct: 'Repeated puffs of air along the mouth’s axis',
    explain: 'Every P, B, T and K releases a burst of air straight out of the lips. A fast verse sends them one after another — a capsule in their path hears pop after pop.',
    why: {
      'Nothing more than a slow verse would send': 'More consonants per second means more puffs per second at the capsule.',
      'Air sideways out of the corners of the mouth': 'The puffs go straight ahead, along the mouth’s axis.',
    },
  },
  {
    id: 'rp.snd.2',
    page: 'sound',
    prompt: 'Where does the sound of a rapper’s voice leave the body?',
    options: ['Through the open mouth', 'Through the chest and the throat', 'Through the top of the head'],
    correct: 'Through the open mouth',
    explain: 'The folds’ buzz is shaped by the throat, the tongue, the teeth and the lips and leaves through the mouth — so every starting point is measured from the lips.',
    why: {
      'Through the chest and the throat': 'The chest and throat vibrate as the performer raps, but a mic hears the voice from the mouth.',
      'Through the top of the head': 'The head vibrates a little; the voice a mic hears leaves through the mouth.',
    },
  },
  {
    id: 'rp.snd.3',
    page: 'sound',
    prompt: 'Why might a mic a little below the mouth line hear softer S sounds?',
    options: ['The hiss of an S travels forward along the axis', 'An S sound comes out of the nose, above the mouth', 'A lower mic turns the whole voice down evenly'],
    correct: 'The hiss of an S travels forward along the axis',
    explain: 'An S or T sends a narrow hiss straight ahead. Out of that straight line the mic hears less of it while the words still reach it — a tendency to check by ear.',
    why: {
      'An S sound comes out of the nose, above the mouth': 'S is shaped by the tongue and the teeth: it leaves through the mouth, ahead.',
      'A lower mic turns the whole voice down evenly': 'A small move changes the balance — less hiss, much the same words — not just the level.',
    },
  },
  hearingCheck('rp.set.1', W),
  {
    id: 'rp.set.2',
    page: 'setting',
    prompt: 'The rapper leans in and out on every line. What do you settle before recording?',
    options: ['A working zone, rehearsed with the loudest lines', 'A mic that follows the head wherever it moves around', 'Nothing: compression will even out the level'],
    correct: 'A working zone, rehearsed with the loudest lines',
    explain: 'Do not chase every syllable with a moving mic: agree a working zone, rehearse the loudest and quietest material inside it, and mark it if that helps.',
    why: {
      'A mic that follows the head wherever it moves around': 'A mic that moves changes the tone and the room on every line. Keep the mic still; agree the zone.',
      'Nothing: compression will even out the level': 'Compression evens the level but not the changing tone and low end of a moving voice.',
    },
  },
  {
    id: 'rp.set.3',
    page: 'setting',
    prompt: 'Before choosing a mic, what do you ask the performer for?',
    options: ['The real verse, the ad-libs and the loudest hook', 'Which rap style it is, so as to choose the mic for it', 'One line spoken quietly, to set the input level'],
    correct: 'The real verse, the ad-libs and the loudest hook',
    explain: 'Hear the actual delivery: the verse, the loudest ad-lib, the quietest internal rhyme, the consonant-heavy words and any shouted hook — and watch how the performer moves.',
    why: {
      'Which rap style it is, so as to choose the mic for it': 'A style suggests a starting hypothesis, not a mic: the individual voice and delivery decide.',
      'One line spoken quietly, to set the input level': 'A quiet line hides the peaks of the ad-libs and the hook. Use the real performance.',
    },
  },
  {
    id: 'rp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which way do the puffs of air of a fast verse go?',
    options: ['Straight out along the mouth’s axis', 'Up and out toward the performer’s nose', 'Out to all sides of the mouth evenly'],
    correct: 'Straight out along the mouth’s axis',
    explain: 'The puffs go straight ahead out of the lips — which is why a screen or a ball grille sits in their path, and why a small angle or a little distance helps.',
    why: {
      'Up and out toward the performer’s nose': 'The nose carries m, n and ng; the puff of a P goes straight out.',
      'Out to all sides of the mouth evenly': 'Sound spreads round the front; the air of a P goes straight ahead.',
    },
  },
  {
    id: 'rp.mic.1',
    page: 'microphone',
    prompt: 'Why is a dynamic a frequent first choice for an aggressive rap delivery?',
    options: ['It takes loud peaks close up and tames harsh highs', 'It needs phantom power to handle the very high level', 'It hears the room more evenly than a condenser'],
    correct: 'It takes loud peaks close up and tames harsh highs',
    explain: 'A dynamic is often preferred for aggressive vocals: it takes loud, close peaks, and its top end can be less harsh than a detailed condenser. A starting hypothesis — audition it.',
    why: {
      'It needs phantom power to handle the very high level': 'A dynamic needs no power at all.',
      'It hears the room more evenly than a condenser': 'Close up, any directional mic hears little of the room; that is not the reason.',
    },
  },
  {
    id: 'rp.mic.2',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics will work?',
    options: ['The handheld dynamic: it needs no power', 'The studio condenser, with a short cable', 'The headset, since its capsule is so tiny'],
    correct: 'The handheld dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. The studio condenser needs phantom power; the headset’s capsule needs phantom power through its adapter, or a wireless pack.',
    why: {
      'The studio condenser, with a short cable': 'Cable length does not power a condenser.',
      'The headset, since its capsule is so tiny': 'Size does not power a condenser: the headset needs phantom power or a pack.',
    },
  },
  {
    id: 'rp.mic.3',
    page: 'microphone',
    prompt: 'The performer moves all over the stage between lines. A mic idea that keeps one distance?',
    options: ['A headset, its capsule by the mouth corner', 'A condenser on a stand at the stage’s centre', 'An omni handheld that hears in all directions'],
    correct: 'A headset, its capsule by the mouth corner',
    explain: 'A headset moves with the head, so the distance holds — placed as its maker says, with its windscreen. It does not remove pops, breath or stage feedback.',
    why: {
      'A condenser on a stand at the stage’s centre': 'A fixed stand mic hears the performer only when they come back to it.',
      'An omni handheld that hears in all directions': 'An omni hears the stage as much as the voice — and it is still at the end of an arm.',
    },
  },
  {
    id: 'rp.mic.4',
    page: 'microphone',
    prompt: 'Why can’t the screened condenser sit 5 cm from the lips?',
    options: ['Its screen, 10 cm ahead of it, would hit the face', 'A condenser cannot pick up a voice from that close', 'The boom of its stand is too short to reach'],
    correct: 'Its screen, 10 cm ahead of it, would hit the face',
    explain: 'The screen sits at least 10 cm in front of the mic, so the mic itself starts about 15 cm out. For a closer sound, a dynamic with its own ball grille is the tool.',
    why: {
      'A condenser cannot pick up a voice from that close': 'It can — but a screen at least 10 cm ahead has no room.',
      'The boom of its stand is too short to reach': 'A boom reaches easily; the screen in front runs out of room.',
    },
  },
  {
    id: 'rp.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 10 cm”. What is that measured from?',
    options: ['The lips, to the front of the mic', 'The performer’s chin, to the grille', 'The screen, to the performer’s nose'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so these distances start at the lips and end at the mic’s front.',
    why: {
      'The performer’s chin, to the grille': 'The chin is not where the sound leaves. Measure from the lips.',
      'The screen, to the performer’s nose': 'The screen sits between: the distance is lips to mic.',
    },
  },
  {
    id: 'rp.place.2',
    page: 'placement',
    prompt: `Inside the working zone, the lips move between 8 and 16 cm from the mic. Roughly how much does the level swing?`,
    options: [`About ${swing(80, 160)} dB: the distance doubles`, 'About 1 dB: the change is tiny', 'About 20 dB: each centimetre counts'],
    correct: `About ${swing(80, 160)} dB: the distance doubles`,
    explain: 'With no reflections the level drops about 6 dB each time the distance doubles — a simplified estimate, but it shows why a lean close up matters so much and why a rehearsed working zone keeps the verse steady.',
    why: {
      'About 1 dB: the change is tiny': 'Close up, a few centimetres is a large share of the distance: doubling it is about 6 dB.',
      'About 20 dB: each centimetre counts': 'That would be ten times the distance. Doubling is about 6 dB.',
    },
  },
  {
    id: 'rp.place.3',
    page: 'placement',
    prompt: 'On the loudest line the rapper leans from 10 cm to 4 cm. Is the change small enough to ignore?',
    options: [`No — it is about ${swing(40, 100)} dB louder, with more low end`, 'Yes — a few centimetres make no real difference at all', 'Yes — as long as the mic is a dynamic'],
    correct: `No — it is about ${swing(40, 100)} dB louder, with more low end`,
    explain: 'From 10 to 4 cm the voice is about 8 dB louder with no reflections, and a directional mic adds low end close up. Rehearse the zone — or back off for the loudest line instead of leaning in.',
    why: {
      'Yes — a few centimetres make no real difference at all': 'Close up, a few centimetres change the distance by half or more: several dB.',
      'Yes — as long as the mic is a dynamic': 'Every mic hears the inverse-square change; a directional one adds low end too.',
    },
  },
  {
    id: 'rp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must the mic, its stand and its cable keep clear of?',
    options: ['The performer’s face, hands and feet as they move', 'The lyric sheet, so the performer can read it', 'The front of the performer, for the camera'],
    correct: 'The performer’s face, hands and feet as they move',
    explain: 'Clearance comes first: nothing touches the face as the head moves inside the working zone, the hands have room, and the stand’s base and the cable stay clear of the feet.',
    why: {
      'The lyric sheet, so the performer can read it': 'Sight lines matter, but the safety question is the performer’s body as it moves.',
      'The front of the performer, for the camera': 'In front of the performer is where the mic goes. What must stay clear is the body.',
    },
  },
  {
    id: 'rp.ctx.1',
    page: 'context',
    prompt: 'A loud show: the performer shouts the hook, a wedge in front. What do you teach about the handheld?',
    options: ['Back off for shouts; keep the grille open', 'Cover the grille with a hand on loud lines', 'Hold it at the chest so it hears less'],
    correct: 'Back off for shouts; keep the grille open',
    explain: 'Close for quiet lines, farther for loud ones, stable in front of the mouth. Covering the grille changes the pattern and brings feedback closer.',
    why: {
      'Cover the grille with a hand on loud lines': 'Cupping changes the pattern and colours the voice — and feedback gets more likely.',
      'Hold it at the chest so it hears less': 'Off the mouth, the words lose clarity while the stage stays just as loud.',
    },
  },
  superNull('rp.ctx.2', 'context', 'wedge'),
  {
    id: 'rp.ctx.studio',
    page: 'context',
    prompt: 'A dry, close rap verse over a dense beat, in a controlled studio. A fair first choice?',
    options: ['A close dynamic at a steady, rehearsed distance', 'A condenser at 30 cm to let the room into the verse', 'Two mics side by side, summed together'],
    correct: 'A close dynamic at a steady, rehearsed distance',
    explain: 'A controlled room and a close dynamic at one steady distance give a concentrated sound that sits in a dense beat. Check the low end and the pops as the verse goes on.',
    why: {
      'A condenser at 30 cm to let the room into the verse': 'That is the open, spacious choice — a production decision for a good room, not a dry verse.',
      'Two mics side by side, summed together': 'Two mics summed on one voice comb-filter; compare them one at a time instead.',
    },
  },
  {
    id: 'rp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does the hiss of an S mostly go?',
    options: ['Forward, along the mouth’s axis', 'Up and out through the nose', 'Down toward the performer’s chest'],
    correct: 'Forward, along the mouth’s axis',
    explain: 'The hiss travels straight ahead — a mic dead on the axis hears the most of it.',
    why: {
      'Up and out through the nose': 'S is shaped by the tongue and the teeth: it leaves through the mouth.',
      'Down toward the performer’s chest': 'It goes ahead along the axis, not down.',
    },
  },
  {
    id: 'rp.two.1',
    page: 'twoMic',
    prompt: 'Two mics on one rapper, 10 cm and 25 cm from the lips, sound hollow together. Why?',
    options: ['The voice reaches them at different times', 'The farther mic reverses the polarity of the voice', 'The closer mic is louder, so it cancels'],
    correct: 'The voice reaches them at different times',
    explain: 'The farther mic hears each word later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic reverses the polarity of the voice': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('rp.two.2'),
  matchedLevels('rp.two.3'),
  {
    id: 'rp.two.4',
    page: 'twoMic',
    prompt: 'Doubled takes of a verse sound hollow when stacked. What do you check first?',
    options: ['The same mic, distance and position for each take', 'More stereo width to spread the takes further apart', 'A different mic for each take of the verse'],
    correct: 'The same mic, distance and position for each take',
    explain: 'For a tight stack, keep each take’s mic, distance and room position consistent, line the performances up, and check the mono sum before widening.',
    why: {
      'More stereo width to spread the takes further apart': 'Width hides the problem in stereo; it returns in mono. Fix the takes first.',
      'A different mic for each take of the verse': 'Deliberate differences can widen a stack — but they change tone and plosives; a tight stack wants consistency.',
    },
  },
  {
    id: 'rp.prac.gain',
    page: 'practice',
    prompt: 'The verse sits well below the overload light, but the loudest ad-lib lights it. What do you do?',
    options: ['Lower the input gain, then re-check the ad-lib', 'Pull the channel fader down until it is clean', 'Ask the performer to drop the loudest ad-lib'],
    correct: 'Lower the input gain, then re-check the ad-lib',
    explain: 'Set the input from the loudest real performance — ad-libs and doubled phrases included — with about 10 dB of headroom (peaks near −10 dBFS) in a digital recording. The fader comes after the overload.',
    why: {
      'Pull the channel fader down until it is clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the performer to drop the loudest ad-lib': 'The ad-lib is the performance. Set the gain for it, and leave headroom.',
    },
  },
  {
    id: 'rp.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the rap vocal?',
    options: ['The first works alone, the pair adds, mono holds', 'Two channels give the mixer more to choose from', 'The voice needs more level than one mic gives'],
    correct: 'The first works alone, the pair adds, mono holds',
    explain: 'A second mic — a room perspective, a different mic to blend — adds a delay and the room. If the pair loses body, move or rebalance, check polarity — or leave it out.',
    why: {
      'Two channels give the mixer more to choose from': 'More channels add spill and a combining check. A second mic should earn its place.',
      'The voice needs more level than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'rp.mix.1',
    page: 'practice',
    prompt: 'The verse sounds boomy whenever the rapper leans in. What is the first thing to look at?',
    options: ['The distance: a working zone, or move back', 'A severe low cut on the channel to remove the boom', 'More compression to hold the level'],
    correct: 'The distance: a working zone, or move back',
    explain: 'Close to a directional mic the low end rises (the proximity effect). Mark a working zone, move back a little, or change the pattern — before a severe low cut that thins the voice.',
    why: {
      'A severe low cut on the channel to remove the boom': 'It removes useful weight from every line, and the boom still comes and goes with the lean.',
      'More compression to hold the level': 'Compression does not change the low end the lean adds.',
    },
  },
  nullOnPaper('rp.mix.2', 'wedge'),
  {
    id: 'rp.mix.3',
    page: 'practice',
    prompt: 'Two mics on one voice sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two', 'Turning the farther mic up until it matches'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the two': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the farther mic up until it matches': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'rp.sym.pops',
    observation: 'Repeated low thumps on every P and B',
    firstChecks: 'Is the capsule too close, or on the air’s axis? A screen or a windscreen, a small angle, a little distance — and the performer’s consonant technique.',
    options: ['A screen, a small angle or a little more distance', 'Cut the low end on the channel until it stops', 'Ask the performer to change the words with P in them'],
    correct: 'A screen, a small angle or a little more distance',
    explain: 'The puffs go straight out of the lips. Break them up, move the capsule off the axis a little, or back off — before a severe low cut that removes useful weight.',
    why: {
      'Cut the low end on the channel until it stops': 'A deep cut thins every line and the capsule still takes the blast. Fix the air path first.',
      'Ask the performer to change the words with P in them': 'The lyric is the song. Change the mic’s place, not the words.',
    },
  },
  {
    id: 'rp.sym.boomy',
    observation: 'The verse sounds boomy as the rapper leans in',
    firstChecks: 'Proximity effect: the performer moving in on a directional mic. Mark a working zone; move back, or change the pattern.',
    options: ['Mark a working zone; move back or change pattern', 'Boost the treble on the channel until the boom is hidden', 'Move the mic closer so the level holds'],
    correct: 'Mark a working zone; move back or change pattern',
    explain: 'Close to a directional mic the lows rise as the distance shrinks. A rehearsed zone, a little more distance or an omni pattern ease it.',
    why: {
      'Boost the treble on the channel until the boom is hidden': 'EQ on top of boom makes the voice harsh. Fix the distance first.',
      'Move the mic closer so the level holds': 'Closer makes the proximity effect stronger.',
    },
  },
  {
    id: 'rp.sym.unclear',
    observation: 'Fast words are unclear',
    firstChecks: 'Is the mic off the mouth, or is the room or an effect smearing them? Aim between the nose and the mouth; reduce the room and the effects.',
    options: ['Aim between nose and mouth; less room and effects', 'Add more reverb so the fast words carry further', 'Turn the beat up so the words sit right inside of it'],
    correct: 'Aim between nose and mouth; less room and effects',
    explain: 'Consonants need the mic in front of the mouth and a dry enough sound. Re-aim between the nose and the mouth; reduce the room and the effects.',
    why: {
      'Add more reverb so the fast words carry further': 'Reverb smears fast consonants further.',
      'Turn the beat up so the words sit right inside of it': 'A louder beat masks the words more.',
    },
  },
  {
    id: 'rp.sym.clips',
    observation: 'The loudest ad-libs clip',
    firstChecks: 'Was the gain set on the quiet verse? Set it from the real peak and leave headroom.',
    options: ['Set the gain from the real peak; leave headroom', 'Pull the fader down after the clipping', 'Ask the performer to skip the loudest of the ad-libs'],
    correct: 'Set the gain from the real peak; leave headroom',
    explain: 'The input clips before the fader. Set the gain on the loudest ad-lib and doubled phrase, with headroom — about 10 dB (peaks near −10 dBFS) in a digital recording.',
    why: {
      'Pull the fader down after the clipping': 'The fader comes after the input: the clipped sound stays clipped.',
      'Ask the performer to skip the loudest of the ad-libs': 'The ad-libs are the performance. Set the gain for them.',
    },
  },
  {
    id: 'rp.sym.feedback',
    observation: 'Feedback on stage, or the wedge rings',
    firstChecks: 'Is the wedge in a sensitive direction, or the grille covered? Lower the level at once, uncover the grille, then use the mic’s actual null.',
    options: ['Lower the level, then put the wedge in the null', 'Turn the vocal up so it covers the ringing', 'Cup the grille so the sound stays inside it'],
    correct: 'Lower the level, then put the wedge in the null',
    explain: 'Lower that send first, then aim the pattern’s rejection at the wedge and keep the grille open. Never provoke feedback on purpose.',
    why: {
      'Turn the vocal up so it covers the ringing': 'More gain feeds the loop. Lower the level first.',
      'Cup the grille so the sound stays inside it': 'Cupping changes the pattern and usually makes feedback more likely.',
    },
  },
  hollowSymptom('rp.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'rp.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a studio rap-vocal setup in the order you would do them.',
    steps: [
      { text: 'Hear the real verse, ad-libs and hook; watch how the performer moves', early: 'Start with the performer and the delivery.' },
      { text: 'Closed-back headphones on, loudspeakers off; a quiet, controlled room', early: 'Settle the room and the monitoring before the mic.' },
      { text: 'Choose a mic for this voice and production, on a stable stand', early: 'Choose once you have heard the delivery.' },
      { text: 'Agree a working zone; place the mic about 10 cm out, clear of the face', early: 'You need a chosen mic and an agreed zone before you place it.' },
      { text: 'Mute the outputs; then switch phantom on if the mic needs it', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the loudest ad-lib, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Rehearse the quietest and loudest lines inside the zone', early: 'Rehearse once the level is set safely.' },
      { text: 'Check the first full take, and a doubled pass in mono', early: 'Check the takes last, once everything is in place.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it from the loudest real performance with headroom.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'rp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio: a dry, fast verse with shouted ad-libs, over a dense beat. A controlled room; phantom power available.',
    setups: [
      { id: 'a', label: 'A dynamic about 10 cm from the lips, in a rehearsed working zone', ok: true, power: 'none', feedback: 'A suggested starting point: dry and focused — check the boom as the performer leans in, and the ad-lib peaks.' },
      { id: 'b', label: 'A condenser about 15 cm out, a screen in front', ok: true, power: 'phantom', feedback: 'A suggested starting point for more detail — check harsh S sounds and the shouted peaks.' },
      { id: 'c', label: 'A handheld the performer moves toward each word', ok: false, power: 'none', feedback: 'Chasing every syllable changes the level and the low end on every line. Agree a zone instead.' },
      { id: 'd', label: 'A condenser 2 cm from the lips with no screen', ok: false, power: 'phantom', feedback: 'Right in the air path of a fast verse: pop after pop, and moisture on the capsule.' },
      { id: 'e', label: 'An omni 1 m away, to catch every move', ok: false, power: 'phantom', feedback: 'A metre away the room joins every word — the opposite of a dry verse, and hard to remove later.' },
    ],
    reasons: [docReason('the lips'), clearReason('the performer’s face, hands and feet, and the working zone'), { id: 'r.zone', label: 'A rehearsed working zone keeps the distance steady', role: 'optional', feedback: 'A fair studio reason.' }, { id: 'r.power', label: 'The channel gives a condenser the phantom power it needs (a dynamic needs none)', role: 'required', feedback: 'Say how the mic is powered.' }, BRAND_REASON('voice'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, a steady distance, clearance from the performer, and the power the mic needs.',
  },
  {
    id: 'rp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live show: the performer moves across the stage, a wedge in front, the beat loud through the PA.',
    setups: [
      { id: 'a', label: 'A handheld dynamic within about 10 cm, its rejection toward the wedge', ok: true, power: 'none', feedback: 'A suggested starting point: close, with distance technique — back off for shouts, keep the grille open.' },
      { id: 'b', label: 'A headset by the mouth corner, set as its maker says', ok: true, power: 'pack', feedback: 'A suggested starting point for a moving performer — check the battery, the pack and the wedge.' },
      { id: 'c', label: 'A handheld cupped tight to keep the sound in', ok: false, power: 'none', feedback: 'Cupping changes the pattern and brings feedback closer.' },
      { id: 'd', label: 'A condenser on a stand at the centre of the stage', ok: false, power: 'phantom', feedback: 'A fixed mic hears the performer only when they come back to it — and the stage the rest of the time.' },
      { id: 'e', label: 'An omni handheld so the performer can turn freely', ok: false, power: 'none', feedback: 'An omni rejects nothing: it hears the wedge and the PA as much as the voice.' },
    ],
    reasons: [docReason('the lips'), clearReason('the performer’s face, hands and feet, and the cable path'), { id: 'r.null', label: 'The pattern’s rejection faces the wedge', role: 'required', feedback: 'Say where the wedge sits against the pattern.' }, { id: 'r.move', label: 'A mic that moves with the head keeps one distance', role: 'optional', feedback: 'A fair live reason for a headset.' }, BRAND_REASON('voice'), { id: 'r.loudest', label: 'Turn it up until the voice is louder than the beat', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close start measured from the lips, the wedge against the actual pattern, an open grille, and a mount that suits the movement.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where is the raw sound of a voice made?', options: ['In the chest', 'At the vocal folds in the throat', 'At the lips'], after: 'Now STEP through (or PLAY ONCE) and watch the breath, the folds, the throat and the mouth.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: the rapper leans from 15 cm to 8 cm on one line. What changes most?', options: ['The level and the low end', 'Only the room sound', 'Nothing you could hear'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the performer. Where will a supercardioid aimed at the mouth reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Where in the body is the raw sound of a voice made?',
    options: ['At the vocal folds, low in the throat', 'In the chest, just behind the breastbone', 'At the lips, as the mouth opens'],
    correct: 'At the vocal folds, low in the throat',
    explain: 'Breath sets the vocal folds buzzing in the voice box; the throat, the tongue, the teeth and the lips shape the buzz into words, and it leaves through the mouth.',
    why: {
      'In the chest, just behind the breastbone': 'The chest supplies the breath and vibrates a little; the buzz is made at the folds.',
      'At the lips, as the mouth opens': 'The lips shape the consonants and let the sound out; the raw buzz is made lower down.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does “it’s rap” tell you about which mic to use?',
    options: ['A starting idea only: hear the actual voice', 'Use a dynamic: rap needs no other choice', 'Use the brightest mic for the clearest words'],
    correct: 'A starting idea only: hear the actual voice',
    explain: 'A dynamic is a frequent first choice for aggressive delivery, but rap is not one sound: the individual voice, the production and the room decide.',
    why: {
      'Use a dynamic: rap needs no other choice': 'A dynamic is a useful first hypothesis, not a rule: a condenser can suit an open, detailed production.',
      'Use the brightest mic for the clearest words': 'A bright mic can turn fast S and T sounds harsh. Choose by ear.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A fast verse full of P and B sends…',
    options: ['Puff after puff of air along the mouth’s axis', 'Air upward and out toward the performer’s nose', 'No air, only sound, toward the mic'],
    correct: 'Puff after puff of air along the mouth’s axis',
    explain: 'Every P and B releases a burst of air straight out of the lips — a fast verse sends them one after another.',
    why: {
      'Air upward and out toward the performer’s nose': 'The nose carries m, n and ng; the puffs go straight out of the lips.',
      'No air, only sound, toward the mic': 'A P is made by releasing held air: the air comes out with the sound.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why might a vocal mic sit a little off the straight line of the mouth?',
    options: ['To keep the air and the S hiss off the capsule', 'Because the voice is much louder off to one side', 'To hear more of the chest and the throat'],
    correct: 'To keep the air and the S hiss off the capsule',
    explain: 'The puffs and the hiss travel along the mouth’s axis. A little off it the mic hears less of them while the voice still reaches it.',
    why: {
      'Because the voice is much louder off to one side': 'The voice is strongest ahead; a small angle trades a little level for fewer pops.',
      'To hear more of the chest and the throat': 'The voice a mic hears leaves through the mouth, not the chest.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a vocal mic, its screen and its stand keep clear of?',
    options: ['The performer’s face, hands and feet as they move', 'The lyric sheet, so the performer can read it', 'The audience’s view of the performer’s face'],
    correct: 'The performer’s face, hands and feet as they move',
    explain: 'Clearance comes first: nothing touches the face as the head moves inside the working zone, the hands have room, and the stand’s base and cable stay clear of the feet.',
    why: {
      'The lyric sheet, so the performer can read it': 'Sight lines matter, but safety is about the performer’s body.',
      'The audience’s view of the performer’s face': 'The view matters less than the performer’s movement and safety.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the performer’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 1000, y: VOICE_DIMS.lipStanding.mm, z: 0 },
    lift: 250,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor about a metre in front of the performer, facing back at them: behind a mic aimed at the mouth, and well below it — so the pattern and the tilt both decide how much it hears.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout: in front of the performer (S-VOC-TIPS) = behind the mic (S-SM58-UG); its distance and size are drawing defaults' },
  },
];

export const E03_LESSON: Lesson = {
  id: 'E03',
  labId: 'ensembles',
  title: 'Rap and Rhythmic Vocal',
  subtitle: 'Fast consonants and sudden peaks: a close, steady distance, a working zone, the grille kept open',
  noun: { one: 'rap vocal', many: 'rap vocals', subject: 'performer', person: true },
  model: E03_MODEL,
  micTypeIds: ['vocDynCard', 'vocDynSuper', 'vocLdc', 'vocHeadset'],
  zones: E03_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The same voice as any singer’s — breath, the vocal folds, the throat and the mouth — used for rhythm and words: fast consonants, sudden accents, shouted hooks and whispered asides, often over a dense beat.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Rap, spoken-word and rhythmic vocals in the studio and on stage — verses, ad-libs, doubles and hooks, into a stand mic or a handheld the artist works with their hand.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries the rhythm of the words as much as their meaning: every consonant has to land. The level jumps from an internal rhyme to a shouted ad-lib — and the performer moves.', src: 'LESSON' },
    { title: 'EVERY DELIVERY IS DIFFERENT', text: 'A low conversational flow, a bright high register, a breathy whisper and a shouted hook each ask something different of the mic — a genre is a starting idea, never a rule.', src: 'S-VOC-REC' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — and a fast verse needs a lot of it, in short, sharp bursts.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of every vowel.' },
      { title: 'The throat and mouth shape it', text: 'The tongue, the teeth and the lips chop the buzz into words: P, B, T, K stop the air and release it; S and F force it through a gap.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — the words, and with them the air of the consonants, straight ahead. Every starting point here is measured from the lips.' },
    ],
    attack: 'P, B, T, K, S and F come thick and fast: every P or B releases a puff of air straight out of the lips, every S or T a narrow hiss. A capsule in their path hears pop after pop; a screen, a ball grille, a small angle or a little distance keeps them off it.',
    body: 'The vowels carry the pitch and much of the level — and they jump from a quiet internal rhyme to a shouted hook. Close to a directional mic, a lean in adds low end (the proximity effect) as well as level. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'DPA-VOICE' },
  },
  setting: {
    items: [
      { id: 'rapper', label: 'the performer', short: 'PERFORMER', note: 'Standing, the mouth at the lip point every distance is read from; the head moves in an agreed working zone.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'zone', label: 'the working zone', short: 'WORKING ZONE', note: 'Where the head moves as the performer raps (dashed in the studio). The mic stays still in front of it; the distance changes as the head moves inside it — rehearse the loudest and quietest lines there.', prov: { kind: 'illustrative', reason: 'rap_vocal/GEOMETRY_PROPOSAL.md env.v.workingZone (drawing default)' }, tag: 'KEEP CLEAR', scene: 'studio' },
      { id: 'space', label: 'the performer’s face, hands and feet', short: 'THE PERFORMER’S SPACE', note: 'Nothing touches the face; the hands have room; the stand’s base and the cable stay clear of the feet.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'phones', label: 'the headphone mix', short: 'HEADPHONES', note: 'Open-back phones, or a loud mix, leak the beat into a close mic. Closed-back, clear enough to hear the consonants and the beat placement without turning it up dangerously.', prov: { kind: 'illustrative', reason: 'the lesson L35, L76' }, tag: 'SPILL', scene: 'studio' },
      { id: 'wedge', label: 'the performer’s floor wedge', short: 'WEDGE', note: 'In front of the performer, facing back at them: behind a mic aimed at the mouth. Align it with the mic’s actual rejection.', prov: { kind: 'illustrative', reason: 'the lesson L43; S-LIVE' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'beat', label: 'the beat and the PA', short: 'BEAT · PA', note: 'The beat, loud through the PA and the wedge, reaches the vocal mic. A close mic with its grille open keeps the voice ahead of it.', prov: { kind: 'illustrative', reason: 'a typical stage' }, tag: 'SPILL', scene: 'stage' },
    ],
    stage: 'LIVE: a handheld within about 10 cm — close for quiet lines, farther for shouts — the grille open, the wedge in the pattern’s null. Lower the levels before moving a live mic.',
    studio: 'STUDIO: a controlled room, closed-back headphones, a close dynamic or a screened condenser, and a working zone agreed with the performer. Keep the distance repeatable through the verse.',
  },
  diagnostic,
  practice: {
    task: 'Choose a rap-vocal setup for a studio verse and for a live show, describe an alternative position, and explain what would justify a second mic. With a real performer and their agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'delivery', label: 'The delivery (in your words)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['handheld dynamic, cardioid', 'handheld dynamic, supercardioid', 'studio condenser with a screen', 'headset', 'other'] },
      { id: 'zone', label: 'Starting position and working zone you tried', kind: 'text' },
      { id: 'distance', label: 'Distance from the lips, and how far the performer moved', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The lip height above the floor (1550 mm standing) and the performer’s whole figure — drawing defaults (the shared adult figure), so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The working zone’s size (the head 6 cm forward, 8 cm back, 4 cm up and down) — a drawing default; the lesson gives no size.', dims: [] },
    { text: 'The level swing across the working zone is the inverse-square law with no reflections — an estimate, not a measurement.', dims: [] },
    { text: 'The handheld’s size, the pop screen’s hoop and tilt, the headset’s capsule place and boom reach, the angles of “a little lower” — drawing defaults; the screen’s 10 cm gap is the maker’s.', dims: [] },
    { text: 'The puff of air and the S hiss on the MEET IT page: their angle and reach are illustrative shapes.', dims: [] },
    { text: 'The wedge’s distance (1 m) and height — a drawing default.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every performer, beat and room is different: move the mic, experiment, and trust your ears. The lab is silent and draws a simplified picture: one performer in a typical standing pose, the working zone as a drawn outline, the airway as a simplified cut, the puff of air and the S hiss as shapes, mic patterns and the two-mic comb as textbook shapes; the level swing is an estimate with no reflections. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Move a real mic near someone’s face only with their agreement.',
  copy: E03_COPY,
};
