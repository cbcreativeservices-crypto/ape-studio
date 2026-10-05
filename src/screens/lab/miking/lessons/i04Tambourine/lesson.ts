/**
 * I04 HEADLESS TAMBOURINE AND JINGLES — the lesson's pages as DATA (blueprint
 * §7). Words from the owner's lesson (docs/labs/miking/source_text/I04-
 * Headless-Tambourine-and-Jingles-Miking-Technique.txt, "L<n>" in COMMENTS
 * only) with the fixes in CORRECTIONS_LOG.md (HT-xx) applied. It cross-links
 * the headed tambourine (M08, Lab 1) in words. OWNER RULING 2026-10-04:
 * starting points; no source, brand or model in learner text; no badges;
 * FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { TMB_MODEL } from './geometry.ts';
import { TMB_ZONES } from './model.ts';
import { TMB_COPY } from './copy.ts';

const W: SpWords = { p: 'tmb', the: 'the tambourine', a: 'a tambourine', noun: 'tambourine', player: 'player', loudest: 'the strongest hit into the hand' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the headless tambourine',
    goal: 'Get to know the headless tambourine and its jingles — what it is, where you meet it, what it does in the music and how it is played — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A frame of loose metal jingles with no head: the jingles are the whole sound. Shaken, struck into the hand, or mounted — and it moves while it plays.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a shake or a strike becomes sound — the frame, the jingles lagging and clashing — and where it leaves. Shown, never played.',
    credit: { scenarios: ['tmb.snd.1', 'tmb.snd.2', 'tmb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The jingles lag the frame and clash — bright, brief, with peaks far above the average. There is no head body to look for.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the tambourine player stands, what is around them, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['tmb.set.1', 'tmb.set.hear', 'tmb.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Watch the whole arc and the loudest accent, check the instrument, never ask for a swing toward the mic. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the tambourine by its properties — pattern, power, size and how it handles brief peaks — not by its brand.',
    credit: { scenarios: ['tmb.mic.1', 'tmb.mic.peak', 'tmb.mic.power', 'tmb.mic.im', 'tmb.rec.1'], note: 'Answer the five checks (one reaches back to how the tambourine sounds).' },
    takeaway: 'Condensers reveal jingle detail; a dynamic or a ribbon can tame a cutting result. The real response, maximum level, pattern and stage matter more than the category.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 15–30 cm from the tambourine itself, as it is played — and read the CLEAR gap to the nearest stroke separately.',
    credit: { scenarios: ['tmb.place.1', 'tmb.place.2', 'tmb.place.3', 'tmb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Measure the start from the instrument as played; keep a CLEAR gap to the nearest stroke; side-to-side tends to be more even than toward-and-away.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and decide whether the tambourine needs its own channel at all.',
    credit: { scenarios: ['tmb.ctx.1', 'tmb.ctx.2', 'tmb.ctx.studio', 'tmb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern; choose the fewest open channels that serve the show; never ask a player to swing toward a capsule.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how two mics hearing one moving tambourine interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['tmb.two.1', 'tmb.two.2', 'tmb.two.3', 'tmb.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Moving arrival times can change the colour from stroke to stroke. Polarity flips the sign; it does not remove a delay. Mono alone often serves.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the arc toward the mic, the peaks, the instrument’s own rattles, spill and monitors — before EQ or filters.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['tmb.prac.order', 'tmb.prac.gain', 'tmb.prac.setup1', 'tmb.prac.setup2', 'tmb.prac.3', 'tmb.mix.1', 'tmb.mix.2', 'tmb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A mic placed for the real arc with its clearance kept, brief peaks caught, motion direction used as a variable, and a studio or live setup justified. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L5-L9 · set L5-L9 · mic L18-L19, L24-L26 ·
 * place L10-L13, L20-L22 · ctx L31-L36 · two L22 · prac L38-L46. */
const scenarios: MikingScenario[] = [
  {
    id: 'tmb.snd.1',
    page: 'sound',
    prompt: 'What makes the sound of a headless tambourine?',
    options: ['The loose jingles clashing against each other', 'A thin head stretched inside the wooden frame', 'The wooden frame ringing like a small drum shell'],
    correct: 'The loose jingles clashing against each other',
    explain: 'With no head, the moving jingles are the principal sound source: pairs of metal discs thrown against each other and their pins.',
    why: {
      'A thin head stretched inside the wooden frame': 'That is a headed tambourine. This one has no head — nothing spans the middle.',
      'The wooden frame ringing like a small drum shell': 'The frame mostly holds the jingles; they make the sound.',
    },
  },
  {
    id: 'tmb.snd.2',
    page: 'sound',
    prompt: 'The sound is thin in the lows. Will aiming the mic at the middle of the ring add body?',
    options: ['No — there is no head there to give a low body', 'Yes — the middle of a tambourine is where the lows are', 'Yes, if the mic is moved much closer to the middle'],
    correct: 'No — there is no head there to give a low body',
    explain: 'A headless tambourine has no head tone to preserve: a mic aimed at a nonexistent skin cannot find an absent low sound.',
    why: {
      'Yes — the middle of a tambourine is where the lows are': 'Only a headed tambourine has a head body; this ring is open.',
      'Yes, if the mic is moved much closer to the middle': 'Closer to empty air adds nothing; the jingles are the source.',
    },
  },
  {
    id: 'tmb.snd.3',
    page: 'sound',
    prompt: 'A strike into the hand versus a regular shake: what differs for the mic?',
    options: ['A stronger, less continuous accent — set gain for it', 'Nothing: the same jingles make the same sound', 'A softer accent, because the hand damps the jingles'],
    correct: 'A stronger, less continuous accent — set gain for it',
    explain: 'A hand strike into the frame often gives a stronger accent than a shake; reset gain for the strongest planned hit.',
    why: {
      'Nothing: the same jingles make the same sound': 'The same jingles, thrown harder and all at once: a different accent.',
      'A softer accent, because the hand damps the jingles': 'The strike jolts every pair at once — usually stronger, not softer.',
    },
  },
  {
    id: 'tmb.set.1',
    page: 'setting',
    prompt: 'Before you place the mic, what do you mark?',
    options: ['The whole arc of the instrument, not just its rest', 'The tambourine at rest, since it returns there', 'The player’s feet, so the stand can go beside them'],
    correct: 'The whole arc of the instrument, not just its rest',
    explain: 'Ask for the loudest accent, a sustained shake and any change of hands or position; the arc decides the clearance.',
    why: {
      'The tambourine at rest, since it returns there': 'At rest says little: a large swing can reach far past it.',
      'The player’s feet, so the stand can go beside them': 'The feet matter for the cable; the arc decides where the mic goes.',
    },
  },
  hearingCheck(W),
  {
    id: 'tmb.set.2',
    page: 'setting',
    prompt: 'For more level, could you ask the player to swing toward the capsule?',
    options: ['No — agree a comfortable zone and place the mic for it', 'Yes — a little closer on the accents helps the channel', 'Yes, as long as the mic is out of the way at rest'],
    correct: 'No — agree a comfortable zone and place the mic for it',
    explain: 'Do not ask a player to swing toward an exposed capsule to increase level: it risks the mic and the player, and jumps in level.',
    why: {
      'Yes — a little closer on the accents helps the channel': 'Level jumps and a struck capsule are the price; place the mic, not the player.',
      'Yes, as long as the mic is out of the way at rest': 'At rest is not the point: the swing decides the clearance.',
    },
  },
  {
    id: 'tmb.mic.1',
    page: 'microphone',
    prompt: 'Through a condenser, the jingles are too cutting. What could you try?',
    options: ['Distance and angle, then perhaps a dynamic or a ribbon', 'A brighter condenser, closer, so the jingles are cleaner', 'Turn the gain down until the jingles stop sounding harsh'],
    correct: 'Distance and angle, then perhaps a dynamic or a ribbon',
    explain: 'If it sounds piercing, compare distance, angle, room and playing method first; a dynamic or a ribbon (safely supported) can soften it.',
    why: {
      'A brighter condenser, closer, so the jingles are cleaner': 'Closer and brighter makes the edge stronger.',
      'Turn the gain down until the jingles stop sounding harsh': 'Gain changes the level, not the balance.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'tmb.mic.im',
    page: 'microphone',
    prompt: 'Why is a tambourine a revealing test of a microphone?',
    options: ['Its dense, brief high peaks expose distortion in the chain', 'Its low thump shows whether the mic has enough bass in it', 'Its long sustain shows how quiet the mic’s own noise floor is'],
    correct: 'Its dense, brief high peaks expose distortion in the chain',
    explain: 'Brief, dense high-frequency peaks show how well — or badly — a mic and the chain behind it handle distortion. Leave headroom.',
    why: {
      'Its low thump shows whether the mic has enough bass in it': 'A headless tambourine has little low end; its peaks are the test.',
      'Its long sustain shows how quiet the mic’s own noise floor is': 'Its sound is short and bright; noise is not what it reveals.',
    },
  },
  {
    id: 'tmb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the jingles hears what, mostly?',
    options: ['Bright, brief clashes with high peaks', 'A deep body from the middle of the ring', 'Mostly the room round the player'],
    correct: 'Bright, brief clashes with high peaks',
    explain: 'The jingles are the source: bright, metallic and peaky. Close, they dominate; the room joins farther away.',
    why: {
      'A deep body from the middle of the ring': 'There is no head: no body in the middle.',
      'Mostly the room round the player': 'Close to the jingles they are far louder than the room.',
    },
  },
  {
    id: 'tmb.place.1',
    page: 'placement',
    prompt: 'The starting point says 15–30 cm. Measured from what?',
    options: ['The tambourine itself, at its normal playing position', 'The player’s chest, wherever the tambourine happens to be', 'The farthest point of the biggest swing, to be safe'],
    correct: 'The tambourine itself, at its normal playing position',
    explain: 'The start is from the instrument as played. The gap to the nearest stroke is a separate CLEAR readout — and comes first.',
    why: {
      'The player’s chest, wherever the tambourine happens to be': 'That is another starting point some use (about 20 cm from the player); this one is from the instrument.',
      'The farthest point of the biggest swing, to be safe': 'The swing sets the clearance; the start is from the instrument as played.',
    },
  },
  {
    id: 'tmb.place.2',
    page: 'placement',
    prompt: 'Shaken toward and away from the mic, the forward accents jump. What could steady it?',
    options: ['A side-to-side shake — if the player chooses it', 'More compression, set fast to hold the accents down', 'A mic placed right in front, inside the swing'],
    correct: 'A side-to-side shake — if the player chooses it',
    explain: 'Toward and away increases level changes; side to side relative to the capsule tends to be more even. A mic slightly above can help too.',
    why: {
      'More compression, set fast to hold the accents down': 'Processing hides a placement cause; the motion direction is the lever.',
      'A mic placed right in front, inside the swing': 'Inside the swing, the frame can strike the mic — and the level jumps more.',
    },
  },
  {
    id: 'tmb.place.3',
    page: 'placement',
    prompt: 'Why can a mic slightly above the playing zone help a side-to-side shake?',
    options: ['The distance to the jingles changes less as they pass', 'Sound rises, so a higher mic hears it louder', 'The jingles point up, so the mic is on their axis'],
    correct: 'The distance to the jingles changes less as they pass',
    explain: 'From above, a lateral motion moves the instrument across the mic’s view, not toward and away — though it depends on the arc and the pattern.',
    why: {
      'Sound rises, so a higher mic hears it louder': 'Sound does not rise; the geometry of the motion is the point.',
      'The jingles point up, so the mic is on their axis': 'Jingles radiate all round; the steadier distance is the point.',
    },
  },
  {
    id: 'tmb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The struck version leaps every hit, the shaken one does not. Why?',
    options: ['A strike gives a stronger, less continuous accent', 'The other hand blocks the mic’s view on each hit', 'The jingles fall silent between the hits'],
    correct: 'A strike gives a stronger, less continuous accent',
    explain: 'A hand strike throws every pair at once: set gain for the strongest planned hit, on a peak meter.',
    why: {
      'The other hand blocks the mic’s view on each hit': 'The hand is not in the mic’s path in a good placement; the accent is stronger.',
      'The jingles fall silent between the hits': 'They shimmer between hits; the strike itself is the stronger accent.',
    },
  },
  {
    id: 'tmb.ctx.1',
    page: 'context',
    prompt: 'Live, before adding a tambourine channel, what do you ask first?',
    options: ['Is it already heard well, acoustically or in other mics?', 'Which brand of mic the band usually uses on the tambourine', 'How loud the channel can be pushed before it starts to feed back'],
    correct: 'Is it already heard well, acoustically or in other mics?',
    explain: 'Nearby vocal or percussion mics may carry it. Choose the fewest open channels that serve the audience and the monitors.',
    why: {
      'Which brand of mic the band usually uses on the tambourine': 'A brand does not decide whether a channel is needed.',
      'How loud the channel can be pushed before it starts to feed back': 'Pushing toward feedback is never the test.',
    },
  },
  {
    id: 'tmb.ctx.2',
    page: 'context',
    prompt: 'A player switches between shakers, tambourine and a cowbell at one station. A fair approach?',
    options: ['A shared percussion mic set for the whole area', 'A close mic on each instrument, all left open', 'A mic clipped to the tambourine, following it around'],
    correct: 'A shared percussion mic set for the whole area',
    explain: 'One overhead or area mic, its height set for the complete performance area, supports a switching player — with less individual control.',
    why: {
      'A close mic on each instrument, all left open': 'Every open mic adds spill and feedback risk.',
      'A mic clipped to the tambourine, following it around': 'Nothing is clipped to a moving instrument without purpose-built hardware and permission.',
    },
  },
  {
    id: 'tmb.ctx.studio',
    page: 'context',
    prompt: 'Layering a tambourine against a hi-hat in the studio. Is there a fixed pan or filter to use?',
    options: ['No — listen to the arrangement and decide', 'Yes — pan it opposite the hi-hat as a fixed rule', 'Yes — a fixed high-pass filter at the same setting'],
    correct: 'No — listen to the arrangement and decide',
    explain: 'Begin with one mono channel; a pan or a filter is chosen by ear in the arrangement, not by rule.',
    why: {
      'Yes — pan it opposite the hi-hat as a fixed rule': 'A rule cannot know the arrangement; listen to it.',
      'Yes — a fixed high-pass filter at the same setting': 'No universal filter suits every tambourine or mix.',
    },
  },
  {
    id: 'tmb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Low thumps appear in the tambourine channel. Is it the instrument’s body?',
    options: ['Unlikely — check footsteps, the stand and handling first', 'Yes — the jingles carry a strong low body of their own', 'Yes — the open ring resonates like a drum when shaken'],
    correct: 'Unlikely — check footsteps, the stand and handling first',
    explain: 'With no head, low thumps are usually footsteps, stand vibration or handling. Secure and isolate first; a high-pass only if no desired body is lost.',
    why: {
      'Yes — the jingles carry a strong low body of their own': 'Jingles are bright and brief; the thump comes from elsewhere.',
      'Yes — the open ring resonates like a drum when shaken': 'There is no head to resonate; check the stand and the floor.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'tmb.two.3',
    page: 'twoMic',
    prompt: 'Two mics hear one shaken tambourine. Why can the sum change colour from stroke to stroke?',
    options: ['The moving instrument changes the arrival times', 'The jingles change pitch as they move', 'The mics’ patterns widen as the jingles approach'],
    correct: 'The moving instrument changes the arrival times',
    explain: 'When more than one mic hears a moving instrument, the arrival times keep changing — and so does the comb. Check each alone and the sum in mono.',
    why: {
      'The jingles change pitch as they move': 'The pitch is the same; the paths to the two mics change.',
      'The mics’ patterns widen as the jingles approach': 'A pattern does not change; the arrival times do.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'tmb.prac.3',
    page: 'practice',
    prompt: 'What would justify a second tambourine mic?',
    options: ['A deliberate spatial idea the arrangement needs', 'Two mics are the usual standard for a tambourine', 'The tambourine needs more level than one mic gives'],
    correct: 'A deliberate spatial idea the arrangement needs',
    explain: 'For this small moving source stereo is optional; one mono channel is the start, and a second must earn its place.',
    why: {
      'Two mics are the usual standard for a tambourine': 'One mic is the usual start; a second has to earn its place.',
      'The tambourine needs more level than one mic gives': 'Level comes from gain, not from another mic.',
    },
  },
  {
    id: 'tmb.mix.1',
    page: 'practice',
    prompt: 'A starting point says “15–30 cm”. What else do you need before placing the mic?',
    options: ['Where the instrument moves, and the gap to the nearest stroke', 'The tambourine’s brand, so that the number fits its exact size', 'Nothing more: the number already says exactly where it goes'],
    correct: 'Where the instrument moves, and the gap to the nearest stroke',
    explain: 'The distance is from the instrument as played; the clearance to the nearest stroke is separate and comes first.',
    why: {
      'The tambourine’s brand, so that the number fits its exact size': 'The brand does not change the reference or the motion.',
      'Nothing more: the number already says exactly where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'tmb.s.piercing',
    observation: 'It sounds piercing',
    firstChecks: 'Distance, angle, the room and the playing method.',
    options: ['Distance, angle, room and playing method first', 'A deep treble cut on the channel EQ', 'Turn the gain down until it is gentler'],
    correct: 'Distance, angle, room and playing method first',
    explain: 'A farther or angled mic softens the direct jingles but adds room and spill — a creative choice, not a fixed cure.',
    why: {
      'A deep treble cut on the channel EQ': 'EQ comes after the physical choices — and dulls everything.',
      'Turn the gain down until it is gentler': 'Gain changes level, not brightness.',
    },
  },
  {
    id: 'tmb.s.jumps',
    observation: 'Alternate strokes jump in level',
    firstChecks: 'Is the instrument shaken toward and away from the mic?',
    options: ['Whether the shake goes toward and away from the mic', 'The cable, because level jumps are electrical', 'A compressor setting, before watching the player'],
    correct: 'Whether the shake goes toward and away from the mic',
    explain: 'Place for the whole arc; side to side tends to be more even — the player’s choice.',
    why: {
      'The cable, because level jumps are electrical': 'Watch the player first: the motion is the common cause.',
      'A compressor setting, before watching the player': 'Processing hides the cause; find it first.',
    },
  },
  {
    id: 'tmb.s.clip',
    observation: 'The hardest hits distort, though the meter looks fine',
    firstChecks: 'A peak meter and the input stage — not a later fader.',
    options: ['Peak indication and the input stage’s headroom', 'Pull the fader down until the hits sound clean', 'An EQ cut at the frequency that distorts'],
    correct: 'Peak indication and the input stage’s headroom',
    explain: 'Slow meters miss brief peaks; reducing a later fader cannot repair an earlier overloaded stage; EQ cannot repair clipping.',
    why: {
      'Pull the fader down until the hits sound clean': 'The fader comes after the overload.',
      'An EQ cut at the frequency that distorts': 'EQ cannot undo clipping.',
    },
  },
  {
    id: 'tmb.s.thump',
    observation: 'Low thumps in the channel',
    firstChecks: 'Footsteps, stand vibration or handling — not the instrument.',
    options: ['Footsteps, the stand and handling first', 'A low boost to make the thump sound musical', 'The tambourine’s head, too slack'],
    correct: 'Footsteps, the stand and handling first',
    explain: 'Secure and isolate the stand, move off the impact path — a high-pass only if no desired body is lost.',
    why: {
      'A low boost to make the thump sound musical': 'It is noise, not the instrument; remove its cause.',
      'The tambourine’s head, too slack': 'A headless tambourine has no head.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC = { id: 'r.doc', label: 'It starts about 15–30 cm from the instrument as played, with a clear gap to the nearest stroke', role: 'required' as const, feedback: 'Say what it is measured from — and that the clearance is separate.' };

const setupTasks: SetupTask[] = [
  {
    id: 'tmb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio overdub: a headless tambourine, shaken and struck into the hand. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 20 cm in front of the tambourine as played, facing the jingles', ok: true, power: 'phantom', feedback: 'The recommended start, outside the arc; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small condenser about 25 cm slightly above the playing zone, looking down', ok: true, power: 'phantom', feedback: 'Also fair: a lateral shake changes the distance less — compare by ear.' },
      { id: 'c', label: 'A mic 5 cm from the jingles, inside the swing', ok: false, power: 'phantom', feedback: 'Inside the arc: the frame could strike it, and every stroke would jump.' },
      { id: 'd', label: 'A mic aimed at the middle of the ring for the body', ok: false, power: 'phantom', feedback: 'There is no head: the middle is empty air.' },
      { id: 'e', label: 'Ask the player to swing toward the capsule on the accents', ok: false, power: 'none', feedback: 'Never ask a player to swing toward an exposed capsule.' },
    ],
    reasons: [DOC, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a start from the instrument as played, a clear gap to the nearest stroke, power that matches the mic.',
  },
  {
    id: 'tmb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: the percussionist switches between shakers and the tambourine at one station. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'One small dynamic for the station, aimed at the playing area, a null toward the wedge', ok: true, power: 'none', feedback: 'A dedicated directional mic for the station; a dynamic needs no phantom.' },
      { id: 'b', label: 'A small dynamic about 25 cm from the tambourine as played, channel muted while placed', ok: true, power: 'none', feedback: 'A dedicated spot; a dynamic needs no phantom. Check the shakers are covered too.' },
      { id: 'c', label: 'A small condenser over the station', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A close mic on each instrument, all left open', ok: false, power: 'none', feedback: 'Every open mic adds spill and feedback risk.' },
      { id: 'e', label: 'Ask the player to stay at the tambourine for the whole set', ok: false, power: 'none', feedback: 'The player’s moves are the music; cover them.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It covers the real station and the motion, outside every arc', role: 'required', feedback: 'Say what it covers — the station and the motion.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'The fewest open channels keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: coverage of the real station, clearance, and power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the hand shakes the frame one way. What do the jingles do at first?', options: ['They lag behind the frame', 'They move exactly with it', 'They stay pressed to one side'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the jingles.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: the mic sits 20 cm in front of the tambourine. Is that its clearance?', options: ['No — the swing may come closer', 'Yes — 20 cm is the gap', 'It depends on the stroke'], after: 'Rest the mic in two zones and read FROM and CLEAR — two different numbers.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'tmb.q.1',
    covers: 'instrument',
    prompt: 'What is missing from a headless tambourine, compared with a headed one?',
    options: ['The head — so there is no drum body to capture', 'The jingles — it is only a plain wooden ring', 'The frame — the jingles hang together on a cord'],
    correct: 'The head — so there is no drum body to capture',
    explain: 'A frame with loose metal jingles and no head: the jingles are the source. The headed tambourine has its own lesson in Lab 1.',
    why: {
      'The jingles — it is only a plain wooden ring': 'The jingles are exactly what it keeps.',
      'The frame — the jingles hang together on a cord': 'It keeps its frame; only the head is missing.',
    },
  },
  {
    id: 'tmb.q.2',
    covers: 'instrument',
    prompt: 'Name three ways a headless tambourine is played.',
    options: ['Shaken, struck into the hand, mounted and struck', 'Bowed, plucked and rubbed along its rim', 'Only shaken; striking it would damage it'],
    correct: 'Shaken, struck into the hand, mounted and struck',
    explain: 'A ring or crescent can be shaken, struck into the hand, or mounted and struck — each with its own attack and path.',
    why: {
      'Bowed, plucked and rubbed along its rim': 'It is shaken and struck.',
      'Only shaken; striking it would damage it': 'Struck into the hand is common; so is a mounted ring and a stick.',
    },
  },
  {
    id: 'tmb.q.3',
    covers: 'sound',
    prompt: 'Why do a tambourine’s peaks catch out a slow meter?',
    options: ['Its transients are much higher than its average', 'Its sound is too low for the meter to read', 'Its jingles confuse the meter’s pitch sensing'],
    correct: 'Its transients are much higher than its average',
    explain: 'Brief, bright peaks far above the average: use a peak indication and set headroom from the loudest passage.',
    why: {
      'Its sound is too low for the meter to read': 'It is the peaks — high and brief — that the meter misses.',
      'Its jingles confuse the meter’s pitch sensing': 'A level meter does not sense pitch; it averages.',
    },
  },
  {
    id: 'tmb.q.4',
    covers: 'sound',
    prompt: 'Shaken, what do the jingles do as the frame moves?',
    options: ['Lag behind, then clash on the change of direction', 'Move exactly with the frame, with no clash', 'Stop ringing as long as the frame keeps moving'],
    correct: 'Lag behind, then clash on the change of direction',
    explain: 'Loose on their pins, the jingles lag the frame and clash when it turns.',
    why: {
      'Move exactly with the frame, with no clash': 'They are loose: they lag, then clash.',
      'Stop ringing as long as the frame keeps moving': 'Moving keeps them clashing; that is the sound.',
    },
  },
  {
    id: 'tmb.q.5',
    covers: 'setting',
    prompt: 'The player switches instruments at one station. What suits that best?',
    options: ['A shared area mic set for the whole station', 'A clip-on mic fixed to the tambourine', 'Asking the player to stay at one instrument'],
    correct: 'A shared area mic set for the whole station',
    explain: 'A shared percussion mic, its height set for the complete area, follows a switching player — with less individual control.',
    why: {
      'A clip-on mic fixed to the tambourine': 'Nothing is clipped to a moving instrument without purpose-built hardware and permission.',
      'Asking the player to stay at one instrument': 'The player’s moves are the music.',
    },
  },
  quickHearing(W),
];

export const I04_LESSON: SpLesson = {
  id: 'I04',
  labId: 'percussion',
  title: 'Headless Tambourine and Jingles',
  subtitle: 'No head, just jingles: from the instrument as played — and a clear gap to the nearest stroke',
  noun: { one: 'headless tambourine', many: 'tambourines' },
  model: TMB_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: TMB_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Inspect the instrument; watch the whole part and mark the arc', early: 'Start with the instrument, the player and the music.' }, { text: 'Hear whether other mics — vocal or percussion — already carry it', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A frame with loose metal jingles and no vibrating head — a ring or a crescent. The moving jingles are the sound. (A headed tambourine adds a drum’s body; it has its own lesson in Lab 1.)', src: 'LESSON-TAMB-HL' },
    { title: 'WHERE YOU MEET IT', text: 'In bands, gospel and pop, at percussion stations and in singers’ hands — on stages and studio overdubs, often sharing a mic with shakers.', src: 'DPA-JONAS' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Shakes, rolls, accents struck into the hand, a mounted ring played with a stick. Each motion gives a different attack and a different path through the air.', src: 'LESSON-TAMB-HL' },
    { title: 'ITS SIZE', text: 'Concert tambourines are often about 10 in across. This lab draws a 10 in ring with one row of jingle pairs — and a crescent as the other shape.', src: 'PAS-ECV01' },
  ],
  sound: {
    stages: [
      { title: 'The hand moves the frame', text: 'The hand shakes the frame (or strikes it into the other hand). The jingles, loose on their pins, do not move with it at first.', byVariant: { struck: 'The frame is struck into the other hand: one sharp jolt.', mounted: 'A stick strikes the frame: one sharp jolt.' } },
      { title: 'The jingles lag', text: 'The frame moves on; the jingle pairs lag behind it, loose in their slots.' },
      { title: 'The pairs clash', text: 'The jingles are thrown against each other and their pins: a bright, metallic clash — the ATTACK.' },
      { title: 'Sound leaves all round', text: 'From the jingles all round the frame — brief and bright, with peaks far above the average. There is no head to add a body.' },
    ],
    attack: 'The jingle pairs clashing on each change of direction — or all at once when the frame is struck. Brief, bright, with high peaks.',
    body: 'A short shimmer as the jingles settle. No head, so no low body: the frame mostly holds the jingles. Tendencies — jingles, rows and players vary.',
    head: { diameterMm: 254, rods: 0, label: 'the ring', strikeSrc: 'LESSON-TAMB-HL' },
  },
  setting: {
    items: [
      { id: 'tambourine', label: 'the tambourine player at the station', short: 'TAMBOURINE', note: 'At a percussion station, often moving between instruments — or singing. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'Shakers, a cowbell, hand drums: the player turns between them; a mic placed for one may miss the next.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'The hi-hat and cymbals sit in the same bright range as the jingles: spill that EQ cannot separate.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the tambourine mic’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic near the station: it may already carry the tambourine — and a tambourine mic hears the voice.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the tambourine', 'A percussion area mic or the vocal mic may already carry the tambourine; a spot is added for an important part in a predictable position.'),
    ],
    stage: 'LIVE: is it already heard? If not, one stable mic aimed at a repeatable zone, positioned with its channel muted, its rejection toward the wedges — soundchecked at a controlled level.',
    studio: 'RECORDING: one mono channel first; compare 15–30 cm with a farther spot at the same playing force; mark the player’s place for repeat takes.',
  },
  diagnostic,
  practice: {
    task: 'Place the mic relative to the real arc with the clearance kept, catch the brief peaks, use the motion direction as a variable, and justify a studio or live setup. With a real tambourine and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Tambourine (ring or crescent, rows, metal)', kind: 'text' },
      { id: 'motion', label: 'How it was played', kind: 'choice', choices: ['shaken', 'struck into the hand', 'mounted', 'a mix'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'large condenser', 'dynamic', 'ribbon (studio)'] },
      { id: 'dist', label: 'Start distance and the CLEAR gap to the nearest stroke', kind: 'text' },
      { id: 'peak', label: 'Peak and distortion check', kind: 'text' },
      { id: 'notes', label: 'Motion direction and what changed', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The frame depth (45 mm) and thickness, 8 slots of Ø 50 mm jingle pairs, the crescent (outer radius 140 mm, 40 mm wide) — drawing defaults.', dims: ['depth', 'frameT', 'slots', 'jingleD', 'crescentR', 'crescentW'] },
    { text: 'The held height (h 1150), the mounted height (h 1000), the shake (±150 mm), the strike toward the other hand (200 mm), the stick’s reach and the player’s posture — drawing defaults and ILLUSTRATIVE.', dims: ['holdH', 'mountH'] },
    { text: 'The reference for 15–30 cm: the lab measures from the instrument’s nearest frame point at its playing position; the CLEAR readout from the drawn motion envelope.', dims: [] },
  ],
  live: { wedges: standingWedges('the tambourine') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every tambourine, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 10 in headless tambourine and a crescent in four ways of playing, mic patterns and the two-mic comb as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: TMB_COPY,
  sp: {
    strikeTitle: 'Shake to sound',
    close: { side: { u0: -360, u1: 300, v0: -1420, v1: -860 }, top: { u0: -360, u1: 300, v0: -380, v1: 380 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'tambourine', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
