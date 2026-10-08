/**
 * I05d GÜIRO — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Guiro-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (GU-xx) applied. OWNER RULING 2026-10-04: starting points; no source,
 * brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, feedbackSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, noPhantom, PEAK_REASON, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, slowMeter, TECH_REASON, type SpWords } from '../shared/smallperc/commonItems.ts';
import type { SpLesson } from '../shared/smallperc/family.ts';
import { STAGE_THINGS, stageItems, standingWedges } from '../shared/smallperc/stage.ts';
import { GU_MODEL } from './geometry.ts';
import { GU_ZONES } from './model.ts';
import { GU_COPY } from './copy.ts';

const W: SpWords = { p: 'gui', the: 'the güiro', a: 'a güiro', noun: 'güiro', player: 'player', loudest: 'the strongest real long scrape' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the güiro',
    goal: 'Get to know the güiro — what it is, where you meet it, what it does in the music and how it is held and scraped — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A hollow, ridged body scraped with a stick or comb, often both ways. The scraper’s whole travel — past each end — is the space to keep clear.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a scrape becomes the güiro’s rasp — each ridge a click, the hollow body under them — and what the stroke’s length does.',
    credit: { scenarios: ['gui.snd.1', 'gui.snd.2', 'gui.snd.3'], interactive: 'soundPath', note: 'Step the scrape through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Many ridge clicks in a row are the rasp; the body resonates under them. Length, pressure and speed shape it — before any mic.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the güiro is played — at a percussion station, near cymbals and drums — and what to do before any mic.',
    credit: { scenarios: ['gui.set.1', 'gui.set.hear', 'gui.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Map the whole stroke, keep the player’s scraper and grip, check for cracks. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the güiro by its properties — pattern, power, size and how it handles the strongest scrape — not by its brand.',
    credit: { scenarios: ['gui.mic.1', 'gui.mic.peak', 'gui.mic.power', 'gui.mic.omni', 'gui.rec.1'], note: 'Answer the five checks (one reaches back to how the güiro sounds).' },
    takeaway: 'A cardioid condenser or another suitable mic. Set headroom on the strongest real long scrape; a pad fixes an overload, not a harsh scraper.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — roughly 30–60 cm from the middle of the scraped area, covering the whole stroke — facing more of the ridges, or a little lower for more body.',
    credit: { scenarios: ['gui.place.1', 'gui.place.2', 'gui.place.3', 'gui.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Two viewpoints to compare — more ridges or more body — both covering the whole stroke, never across the scraper’s path.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and decide between a shared mic and a spot.',
    credit: { scenarios: ['gui.ctx.1', 'gui.ctx.2', 'gui.ctx.studio', 'gui.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A shared area mic may carry it in a quiet arrangement; a spot near a predictable station on a loud stage. Never add gain to beat feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how a güiro spot and a main or percussion mic interact — arrival times, comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['gui.two.1', 'gui.two.2', 'gui.two.3', 'gui.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The same stroke arrives at two mics at different times. Polarity flips the sign; it does not remove a delay. Check in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'The stroke and the scraper first — then the aim, the support, the stage that overloads, spill and the monitors.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.',
    credit: { scenarios: ['gui.prac.order', 'gui.prac.gain', 'gui.prac.setup1', 'gui.prac.setup2', 'gui.prac.3', 'gui.mix.1', 'gui.mix.2', 'gui.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'The whole scraped surface covered safely, the stroke told apart from the mic position, shared mic or spot chosen by spill, and a credible answer to feedback. More than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L7-L8 · set L10, L41 · mic L11-L13, L34 ·
 * place L11-L14 · ctx L35-L38 · two L35 · prac L69-L73. */
const scenarios: MikingScenario[] = [
  {
    id: 'gui.snd.1',
    page: 'sound',
    prompt: 'What makes the güiro’s rasp?',
    options: ['The scraper crossing ridges: a click per ridge', 'Loose beads rattling inside the hollow body', 'The scraper’s own wood ringing on its own, like a bar'],
    correct: 'The scraper crossing ridges: a click per ridge',
    explain: 'A stick or comb runs across the ridges on a resonating body: a scraped idiophone.',
    why: {
      'Loose beads rattling inside the hollow body': 'That is a shaker; the güiro is scraped.',
      'The scraper’s own wood ringing on its own, like a bar': 'The ridges and the body make the sound, not the scraper ringing.',
    },
  },
  {
    id: 'gui.snd.2',
    page: 'sound',
    prompt: 'A short scrape, then a long one. What changes?',
    options: ['A short sound, then a long one', 'Nothing: the rasp is the same length', 'The long one comes out much louder'],
    correct: 'A short sound, then a long one',
    explain: 'Short and long scrapes create correspondingly short and long sounds; pressure and speed shape it too.',
    why: {
      'Nothing: the rasp is the same length': 'The rasp lasts as long as the scraper crosses ridges.',
      'The long one comes out much louder': 'Length sets the duration; pressure and speed shape loudness.',
    },
  },
  {
    id: 'gui.snd.3',
    page: 'sound',
    prompt: 'Does a fiberglass güiro have its own fixed mic curve?',
    options: ['No — the material names an example, not a curve', 'Yes — fiberglass comes out the brighter of the two', 'Yes — gourds sound darker, so they need a boost'],
    correct: 'No — the material names an example, not a curve',
    explain: 'Material names describe examples, not fixed microphone frequency curves. Listen to the one in the room.',
    why: {
      'Yes — fiberglass comes out the brighter of the two': 'No such rule; compare the actual instruments.',
      'Yes — gourds sound darker, so they need a boost': 'Listen first; EQ cannot claim a construction that is absent.',
    },
  },
  {
    id: 'gui.set.1',
    page: 'setting',
    prompt: 'Before any mic, what do you map?',
    options: ['The ridges used, the overshoot past both ends and the return', 'Only the middle of the ridges, where the scraper starts', 'The güiro’s maker and model, so the right mic can be chosen for it'],
    correct: 'The ridges used, the overshoot past both ends and the return',
    explain: 'Have the player play the full part; mark the ridge section used, the overshoot beyond both ends, and how the body moves.',
    why: {
      'Only the middle of the ridges, where the scraper starts': 'A mic placed from one short stroke may miss the end of a long one.',
      'The güiro’s maker and model, so the right mic can be chosen for it': 'The stroke matters more than the maker.',
    },
  },
  hearingCheck(W),
  {
    id: 'gui.set.2',
    page: 'setting',
    prompt: 'The player has a gentle wooden scraper. Do you suggest a metal one?',
    options: ['Not without the player and maker agreeing', 'Yes — a metal scraper is brighter and louder', 'Yes — a harder scraper reaches the mic better'],
    correct: 'Not without the player and maker agreeing',
    explain: 'Do not prescribe a metal scraper for a delicate gourd without confirming the maker and the player consider it suitable.',
    why: {
      'Yes — a metal scraper is brighter and louder': 'It can damage a gourd, and it changes the part.',
      'Yes — a harder scraper reaches the mic better': 'Reach is a placement question, not a scraper question.',
    },
  },
  {
    id: 'gui.mic.1',
    page: 'microphone',
    prompt: 'Harsh scraping, or electronic clipping? A pad fixes which?',
    options: ['The overload at the mic or preamp stage', 'A harsh, abrasive scraper on the ridges', 'Stage bleed reaching the güiro’s mic'],
    correct: 'The overload at the mic or preamp stage',
    explain: 'A pad addresses the overloaded mic or preamp, not an acoustically abrasive scraper or stage bleed.',
    why: {
      'A harsh, abrasive scraper on the ridges': 'That is the source; change the scraper or the stroke with the player.',
      'Stage bleed reaching the güiro’s mic': 'A pad lowers the güiro and the bleed together.',
    },
  },
  slowMeter(W),
  noPhantom(W),
  {
    id: 'gui.mic.omni',
    page: 'microphone',
    prompt: 'A quiet overdub room, no bleed to reject. Is an omni fair?',
    options: ['Yes — for more even coverage of the stroke', 'No — percussion has to use a cardioid mic', 'No — an omni hears the ridges far too sharply'],
    correct: 'Yes — for more even coverage of the stroke',
    explain: 'In a quiet room an omni may give more even coverage if bleed rejection does not matter; a cardioid stays useful for noise control.',
    why: {
      'No — percussion has to use a cardioid mic': 'No such rule; it depends on the room and the bleed.',
      'No — an omni hears the ridges far too sharply': 'The pattern sets coverage and rejection, not sharpness.',
    },
  },
  {
    id: 'gui.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The mic was placed while the player made one short stroke. What can go wrong?',
    options: ['A long scrape’s far end leaves the pickup', 'Nothing — one stroke shows the whole part well', 'The short stroke will be too loud on the take'],
    correct: 'A long scrape’s far end leaves the pickup',
    explain: 'A mic placed from a single short stroke may miss the opposite end of a long scrape. Ask for the real sequence.',
    why: {
      'Nothing — one stroke shows the whole part well': 'Long strokes and returns travel farther.',
      'The short stroke will be too loud on the take': 'Short strokes tend to be the quieter ones.',
    },
  },
  {
    id: 'gui.place.1',
    page: 'placement',
    prompt: 'The stroke travels widely. Which way do you move the mic?',
    options: ['Farther back, to cover the whole path', 'Closer, so the ridges dominate the sound', 'Into the path, so it follows the scraper'],
    correct: 'Farther back, to cover the whole path',
    explain: 'Move farther when the instrument or scraper travels widely; never force the player to scrape toward the mic.',
    why: {
      'Closer, so the ridges dominate the sound': 'Closer favours one section of the stroke.',
      'Into the path, so it follows the scraper': 'Never across the scraper’s path.',
    },
  },
  {
    id: 'gui.place.2',
    page: 'placement',
    prompt: 'Aiming into the güiro’s open end: fuller by rule?',
    options: ['No rule — compare safe viewpoints by ear', 'Yes — the open end is where the body sounds', 'Yes — and it also reduces the harshness'],
    correct: 'No rule — compare safe viewpoints by ear',
    explain: 'There is no established rule that aiming into an open end sounds fuller, or that one side reduces harshness.',
    why: {
      'Yes — the open end is where the body sounds': 'The whole body radiates; compare viewpoints.',
      'Yes — and it also reduces the harshness': 'No source establishes that; listen.',
    },
  },
  {
    id: 'gui.place.3',
    page: 'placement',
    prompt: 'Closer to the active ridges: what is the risk?',
    options: ['One small section of the stroke is overemphasised', 'The room becomes too loud in the recording', 'Less direct sound than from a position farther away'],
    correct: 'One small section of the stroke is overemphasised',
    explain: 'Closer gives more direct scrape but can overemphasise a small section and track the body’s movement unevenly.',
    why: {
      'The room becomes too loud in the recording': 'Closer brings less room, not more.',
      'Less direct sound than from a position farther away': 'Closer gives more direct sound.',
    },
  },
  {
    id: 'gui.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The rasp is harsh in every position. What do you audition first?',
    options: ['The scraper, the grip and the surface', 'A bright mic, moved closer to the ridges', 'A big high cut on the channel’s EQ'],
    correct: 'The scraper, the grip and the surface',
    explain: 'Audition the source, the grip, an alternate surface and a safe mic distance — with the player.',
    why: {
      'A bright mic, moved closer to the ridges': 'Closer and brighter makes the rasp dominate more.',
      'A big high cut on the channel’s EQ': 'Start with the source before EQ.',
    },
  },
  {
    id: 'gui.ctx.1',
    page: 'context',
    prompt: 'A quiet acoustic arrangement. Does the güiro need its own spot?',
    options: ['Not always — a shared area mic may suffice', 'Yes — each percussion instrument needs a mic', 'Yes — area mics cannot hear a scraped güiro'],
    correct: 'Not always — a shared area mic may suffice',
    explain: 'In a low-volume acoustic arrangement a shared percussion area mic may suffice; add a spot only for independent control.',
    why: {
      'Yes — each percussion instrument needs a mic': 'Each mic adds spill; it must earn its place.',
      'Yes — area mics cannot hear a scraped güiro': 'They can, in a quiet arrangement.',
    },
  },
  {
    id: 'gui.ctx.2',
    page: 'context',
    prompt: 'The spot mostly hears cymbals and wedges. First move?',
    options: ['Move the player or mic, and use the rejection', 'Add gain until the güiro comes through', 'A foam windscreen on the spot to cut down the spill'],
    correct: 'Move the player or mic, and use the rejection',
    explain: 'Move the player or the mic, adjust the rejection and the nearby stage level.',
    why: {
      'Add gain until the güiro comes through': 'Gain raises the spill and the feedback risk with it.',
      'A foam windscreen on the spot to cut down the spill': 'A windscreen helps with wind, not with spill.',
    },
  },
  {
    id: 'gui.ctx.studio',
    page: 'context',
    prompt: 'The player turns the güiro to reach another surface. What do you do?',
    options: ['Rehearse the turns; widen the coverage or fix positions', 'Ask the player to keep it on one surface only', 'Add a second mic just for the second surface, on its own stand'],
    correct: 'Rehearse the turns; widen the coverage or fix positions',
    explain: 'If the player turns the instrument to reach several surfaces, rehearse those turns and either enlarge the coverage or arrange repeatable positions.',
    why: {
      'Ask the player to keep it on one surface only': 'The part is the player’s; place the mic for it.',
      'Add a second mic just for the second surface, on its own stand': 'A second channel adds spill and a delay; widen the coverage first.',
    },
  },
  {
    id: 'gui.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Low thumps or rattles on the scrapes. Where do you look first?',
    options: ['The body, holder or cable touching the stand', 'The ridges — they are wearing out under the scraper', 'The scraper — it needs replacing now'],
    correct: 'The body, holder or cable touching the stand',
    explain: 'Stabilise the support, clear the cable and reassess the handling.',
    why: {
      'The ridges — they are wearing out under the scraper': 'Thumps point at contact with the stand first.',
      'The scraper — it needs replacing now': 'Check the support and the cable before the scraper.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'gui.two.3',
    page: 'twoMic',
    prompt: 'Spot plus main sounds thin or odd. What do you check?',
    options: ['Both together and in mono, at the intended levels', 'The spot soloed, at a comfortably high listening level', 'The main mic alone, since it hears the room'],
    correct: 'Both together and in mono, at the intended levels',
    explain: 'Does summing change the same stroke’s tone? Listen together and in mono; reposition or rebalance.',
    why: {
      'The spot soloed, at a comfortably high listening level': 'Soloed, the spot hides how it combines.',
      'The main mic alone, since it hears the room': 'The combination is the question.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'gui.prac.3',
    page: 'practice',
    prompt: 'What would justify stereo on one güiro?',
    options: ['An artistic choice for a larger image', 'The ridges need two mics to be heard', 'A güiro is a stereo source by nature, like a piano'],
    correct: 'An artistic choice for a larger image',
    explain: 'A single mono mic often gives enough control for one player; stereo is an artistic choice, not imposed by the ridges.',
    why: {
      'The ridges need two mics to be heard': 'One mic covering the whole stroke hears them.',
      'A güiro is a stereo source by nature, like a piano': 'One player, one source: mono often does.',
    },
  },
  {
    id: 'gui.mix.1',
    page: 'practice',
    prompt: 'A starting point says “30–60 cm”. What else do you need before placing the mic?',
    options: ['The whole stroke, the holding hand, the viewpoint', 'The güiro’s maker, so the number fits its size', 'Nothing more: the number already says where it goes'],
    correct: 'The whole stroke, the holding hand, the viewpoint',
    explain: 'The stroke sets the clearance, the hand sets the space, the viewpoint sets the balance.',
    why: {
      'The güiro’s maker, so the number fits its size': 'The maker does not change the stroke or the view.',
      'Nothing more: the number already says where it goes': 'A distance means nothing without the motion and the aim.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'gui.s.start',
    observation: 'Only the start of a long scrape is clear',
    firstChecks: 'Does the rest of the path leave the pickup area?',
    options: ['Re-aim at the whole section, or step back', 'Ask for shorter scrapes from the player', 'A compressor to lift the scrape’s quiet end'],
    correct: 'Re-aim at the whole section, or step back',
    explain: 'Re-aim at the whole active section or step back while keeping useful direct sound.',
    why: {
      'Ask for shorter scrapes from the player': 'The strokes are the music.',
      'A compressor to lift the scrape’s quiet end': 'The far end is off axis, not quiet.',
    },
  },
  {
    id: 'gui.s.scratch',
    observation: 'Scratch dominates, with little body',
    firstChecks: 'Is the scraper or surface sharp — or the mic too close?',
    options: ['The scraper, the grip, the surface — then the distance', 'A deep treble cut on the channel’s EQ to soften the scratch', 'A brighter mic, aimed straight at the ridges'],
    correct: 'The scraper, the grip, the surface — then the distance',
    explain: 'Audition the source, the grip, an alternate surface and a safe mic distance.',
    why: {
      'A deep treble cut on the channel’s EQ to soften the scratch': 'EQ dulls the rasp without adding body.',
      'A brighter mic, aimed straight at the ridges': 'That favours the scratch even more.',
    },
  },
  {
    id: 'gui.s.short',
    observation: 'Short strokes disappear',
    firstChecks: 'Are they quieter, off axis or masked by the drums?',
    options: ['The articulation and the layout, before gain', 'More gain on the channel until they show', 'A gate on the channel, opened wide to let them through'],
    correct: 'The articulation and the layout, before gain',
    explain: 'Check the player’s intended articulation and the acoustic layout before gain.',
    why: {
      'More gain on the channel until they show': 'Gain lifts the drums with them.',
      'A gate on the channel, opened wide to let them through': 'A gate cannot find what the mic does not hear.',
    },
  },
  {
    id: 'gui.s.spill',
    observation: 'The spot mostly hears cymbals or wedges',
    firstChecks: 'Is the güiro’s direct sound weak against the spill?',
    options: ['Move the player or mic; use the rejection', 'Turn the spot up until it wins', 'A high cut on the spot to tame the cymbals in it'],
    correct: 'Move the player or mic; use the rejection',
    explain: 'Move the player or the mic, adjust the rejection and the nearby stage level.',
    why: {
      'Turn the spot up until it wins': 'Gain raises the spill with it.',
      'A high cut on the spot to tame the cymbals in it': 'It dulls the rasp too.',
    },
  },
  feedbackSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const setupTasks: SetupTask[] = [
  {
    id: 'gui.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio overdub: one gourd güiro, the player’s own wooden scraper, short accents and long strokes. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 45 cm in front, a little higher, facing more of the ridges', ok: true, power: 'phantom', feedback: 'Covers the whole stroke from outside its path; it needs the phantom this channel has.' },
      { id: 'b', label: 'Dynamic about 45 cm in front, roughly level, for more body', ok: true, power: 'none', feedback: 'The other viewpoint; a dynamic needs no power.' },
      { id: 'c', label: 'Condenser 10 cm from the middle of the ridges', ok: false, power: 'phantom', feedback: 'Inside the scraper’s path, and it would hear one small section of the stroke.' },
      { id: 'd', label: 'A small mic slipped inside the gourd', ok: false, power: 'phantom', feedback: 'Never inside a fragile gourd.' },
      { id: 'e', label: 'Ask the player to scrape toward the mic', ok: false, power: 'none', feedback: 'Never force the player to scrape toward the mic.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It starts about 30–60 cm from the middle of the scraped area, covering the whole stroke', role: 'required', feedback: 'Say what it is measured from — and how it stays clear.' }, CLEAR_REASON, POWER_REASON, PEAK_REASON, BRAND_REASON, TECH_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: the whole stroke covered, a start outside its path, power that matches the mic.',
  },
  {
    id: 'gui.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show: a güiro at a percussion station next to the drum kit. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'A dynamic on its own stand near the station, a null toward the wedge', ok: true, power: 'none', feedback: 'A spot near a predictable station; a dynamic needs no phantom.' },
      { id: 'b', label: 'The station’s shared area mic, if it carries the güiro in balance', ok: true, power: 'none', feedback: 'Fair if it serves: fewer open mics.' },
      { id: 'c', label: 'A condenser spot on the güiro', ok: false, power: 'phantom', feedback: 'This input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A mic held close by the player’s other hand', ok: false, power: 'none', feedback: 'The holding hand is busy — and the mic would sit in the stroke.' },
      { id: 'e', label: 'Turn the güiro’s channel up until it beats the cymbals', ok: false, power: 'none', feedback: 'More gain raises the cymbals and the feedback risk too.' },
    ],
    reasons: [{ id: 'r.doc', label: 'It hears more güiro than spill, clear of the whole stroke', role: 'required', feedback: 'Say what it hears — and how it stays clear.' }, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Fewer open mics keep spill and feedback down', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, TECH_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a useful direct-to-spill ratio, clearance, and power the input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what makes the rasp?', options: ['A click at each ridge', 'One long ring of the body', 'The scraper vibrating'], after: 'Now STEP through the scrape (or PLAY ONCE) and watch the ridges it crosses.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: facing more of the ridges, or a little lower — which hears more body?', options: ['Facing the ridges', 'A little lower', 'It depends on this güiro'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits behind the mic and off to one side. Can a cardioid’s null reach it?', options: ['Yes — with a tilt of the mic', 'No — only a tighter pattern’s null can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'gui.q.1',
    covers: 'instrument',
    prompt: 'What kind of instrument is the güiro?',
    options: ['A scraped idiophone', 'A shaken rattle with beads inside', 'A drum with a head'],
    correct: 'A scraped idiophone',
    explain: 'A stick or comb runs across ridges on a resonating body: a scraped idiophone.',
    why: {
      'A shaken rattle with beads inside': 'It is scraped, not shaken.',
      'A drum with a head': 'There is no head; the body itself sounds.',
    },
  },
  {
    id: 'gui.q.2',
    covers: 'instrument',
    prompt: 'A metal scraper instrument from the Dominican Republic: is it a güiro?',
    options: ['No — a related but distinct instrument', 'Yes — just the metal version of it', 'Yes — the name means the same instrument'],
    correct: 'No — a related but distinct instrument',
    explain: 'The metal güira is related but has its own construction and performance context; this lesson is the güiro.',
    why: {
      'Yes — just the metal version of it': 'It is a distinct instrument, not a material option.',
      'Yes — the name means the same instrument': 'The names overlap in places; the instruments differ.',
    },
  },
  {
    id: 'gui.q.3',
    covers: 'sound',
    prompt: 'What shapes the rasp before any mic?',
    options: ['The stroke’s length, pressure and speed', 'Only the material the body is made from', 'Only the mic’s distance from the ridges'],
    correct: 'The stroke’s length, pressure and speed',
    explain: 'Short and long scrapes make short and long sounds; pressure and speed shape articulation and loudness.',
    why: {
      'Only the material the body is made from': 'The material is one part; the stroke shapes it.',
      'Only the mic’s distance from the ridges': 'The sound exists before the mic.',
    },
  },
  {
    id: 'gui.q.4',
    covers: 'sound',
    prompt: 'A long scrape crosses many ridges. What do you hear?',
    options: ['A long rasp', 'A single click', 'A sustained note'],
    correct: 'A long rasp',
    explain: 'Many ridge clicks in a row are a long rasp.',
    why: {
      'A single click': 'That is one ridge, or a tap.',
      'A sustained note': 'The rasp is many clicks, not a held pitch.',
    },
  },
  {
    id: 'gui.q.5',
    covers: 'setting',
    prompt: 'What sets the minimum gap for a güiro mic?',
    options: ['The scraper’s whole travel, past both ends', 'The güiro’s length and its diameter', 'The length of the microphone’s body and its clip'],
    correct: 'The scraper’s whole travel, past both ends',
    explain: 'Keep the mic, stand and cable outside the whole stroke, its overshoot and the return.',
    why: {
      'The güiro’s length and its diameter': 'The body stays roughly put; the scraper moves.',
      'The length of the microphone’s body and its clip': 'Fitting is not clearing the stroke.',
    },
  },
  quickHearing(W),
];

export const I05D_LESSON: SpLesson = {
  id: 'I05d',
  labId: 'percussion',
  title: 'Güiro',
  subtitle: 'A scraped gourd: cover the whole stroke, both ways — never across the scraper’s path',
  noun: { one: 'güiro', many: 'güiros' },
  model: GU_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: GU_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Map the whole stroke with the player’s own scraper and grip', early: 'Start with the player, the stroke and the music.' }, { text: 'Hear whether a main or percussion mic already carries the güiro', early: 'Hear what the existing mics give before you add one.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A hollow, ridged body — most often a gourd, also wood or fiberglass — scraped with a stick or comb: a scraped idiophone. The metal güira is a related but different instrument.', src: 'MET-GUIRO' },
    { title: 'WHERE YOU MEET IT', text: 'In Latin American music and beyond: at percussion stations, in studios, in ensembles — often near cymbals and drums.', src: 'GRIN-GUIRO' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A rasp: short accents and long strokes, often both ways. The player shapes it with the stroke’s length, pressure and speed.', src: 'PAS-ECV0227' },
    { title: 'ITS SIZE', text: 'A museum example is about 38 cm long; this lab draws one that size, held across the player’s front.', src: 'MET-GUIRO' },
  ],
  sound: {
    stages: [
      { title: 'The scraper starts', text: 'The scraper starts at one end of the ridges.' },
      { title: 'Ridge by ridge', text: 'Each ridge it crosses flicks it: a tiny CLICK. Many in a row are the rasp.' },
      { title: 'The body resonates', text: 'The hollow body resonates under the clicks: the BODY of the sound.' },
      { title: 'Sound leaves', text: 'From the whole body. The stroke runs past the end — and often back.' },
    ],
    attack: 'Each ridge the scraper crosses: a click — sharper with a harder scraper or more pressure.',
    body: 'The hollow body resonating under the clicks. Tendencies — güiros, scrapers and strokes vary.',
    head: { diameterMm: 90, rods: 0, label: 'the güiro', strikeSrc: 'PAS-ECV0227' },
  },
  setting: {
    items: [
      { id: 'guiro', label: 'the güiro player', short: 'GÜIRO', note: 'At the percussion station, standing, the güiro across their front. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical station layout; no source gives positions' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'perc', label: 'other percussion at the station', short: 'PERCUSSION', note: 'The player may move between instruments: a predictable station keeps the güiro where the mic expects it.', prov: { kind: 'illustrative', reason: 'a typical station layout' }, tag: 'STATIONS', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'Cymbals near the güiro: a spot must be near enough for useful direct sound.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'amp', label: 'a guitar amp', short: 'AMP', note: 'Loud upstage: aim the güiro mic’s rejection toward it where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'vocal', label: 'a singer’s microphone', short: 'VOCAL MIC', note: 'Another open mic: it hears the rasp too.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'ANOTHER MIC', scene: 'kit' },
      ...stageItems('the güiro', 'A percussion area mic may already carry the güiro in a quiet arrangement; a spot only for its own level.'),
    ],
    stage: 'LIVE: a shared area mic may do in a quiet arrangement; on a loud stage, a directional spot near a predictable station, its null toward the wedge — soundchecked with the full band and the whole phrase.',
    studio: 'RECORDING: one mono mic often gives enough control — the whole stroke covered, a close and a wider position compared at matched level.',
  },
  diagnostic,
  practice: {
    task: 'Cover the whole scraped surface safely, tell the stroke apart from the mic position, choose a shared mic or a spot by spill, and give a credible answer to feedback. With a real güiro and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'inst', label: 'Güiro, scraper and grip', kind: 'text' },
      { id: 'build', label: 'Build', kind: 'choice', choices: ['gourd', 'wood', 'fiberglass', 'other'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'omni', 'shared mic only'] },
      { id: 'dist', label: 'Distances you tried (about 30 and 60 cm)', kind: 'text' },
      { id: 'view', label: 'Viewpoint: ridges or body — what changed', kind: 'text' },
      { id: 'notes', label: 'What you heard (rasp, body, return stroke, room, spill)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The güiro’s diameter (90 mm tapering to 60), its ridges (the middle 60 % of its length, 3 mm apart) and its grip holes (22 mm) — drawing defaults; the length is a museum example’s.', dims: ['dMax', 'dMin', 'pitch', 'hole'] },
    { text: 'The scraper (180 mm), its overshoot past each end (60 mm), and the player’s posture — drawing defaults and ILLUSTRATIVE.', dims: ['scraper', 'over'] },
    { text: 'The 30–60 cm band is the lesson’s own audition range, not a published güiro standard.', dims: [] },
  ],
  live: { wedges: standingWedges('the güiro') },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every güiro, scraper, stroke and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a güiro held across the player’s front, its ridges drawn wider apart than real, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: GU_COPY,
  sp: {
    strikeTitle: 'Scrape to sound',
    close: { side: { u0: -380, u1: 260, v0: -1400, v1: -900 }, top: { u0: -380, u1: 260, v0: -320, v1: 320 } },
    plan: {
      box: { u0: -2600, u1: 2700, v0: -2100, v1: 2100 },
      things: [
        { id: 'guiro', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -250, v: 1050, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1500, v: -1350, scene: 'all' },
        { id: 'amp', kind: 'amp', u: -1900, v: 950, face: 0, scene: 'all' },
        { id: 'vocal', kind: 'micstand', u: 1100, v: -1350, scene: 'all' },
        ...STAGE_THINGS,
      ],
    },
  },
};
