/**
 * M06 TIMPANI — the lesson's pages as DATA (blueprint §7). Words from the
 * owner's lesson (docs/labs/miking/source_text/Timpani-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (T-xx) applied. OWNER RULING 2026-10-04: starting points, never dogma; no
 * source, brand or model in learner text; no badges; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, cardioidNull, CLEAR_REASON, contactSymptom, distortionSymptom, firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, polarityKeepsDelay, POWER_REASON, quickHearing, setupOrder, type Words } from '../shared/concert/commonItems.ts';
import { TIMP_MODEL } from './geometry.ts';
import { TIMP_ZONES } from './model.ts';
import { TIMP_COPY } from './copy.ts';

const W: Words = { p: 'tp', the: 'the timpani', player: 'timpanist', loudest: 'the loudest roll' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the timpani',
    goal: 'Get to know the timpani — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Each timpano is one tuned head over a copper bowl; the pedal changes its pitch. Sets of two to five drums are common, in an order the player chooses.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a mallet stroke becomes a pitched note — the head, the bowl’s air, the strike point — and where the sound leaves the drum. Shown, never played.',
    credit: { scenarios: ['tp.snd.1', 'tp.snd.2', 'tp.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Struck about a third of the way in from the hoop, the head rings mostly in its pitched see-saw shapes; the bowl’s air pulls them into near-whole-number steps — the note. A centre strike gives more thud and less note. Sound leaves from the head, up and out.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where the timpani sit in the orchestra — their neighbours, the player’s space and sightline, what an amplified stage and a recording add — and what to do before any mic.',
    credit: { scenarios: ['tp.set.1', 'tp.set.hear', 'tp.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Listen to the main pickup before adding a spot. The mallets’ sweep, the pedals and the sightline to the conductor are the player’s; protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the timpani by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['tp.mic.1', 'tp.mic.2', 'tp.mic.3', 'tp.mic.4', 'tp.rec.1'], note: 'Answer the five checks (one reaches back to how the timpani sound).' },
    takeaway: 'A cardioid condenser is a common spot; other mics can work when their response, pattern, maximum level, power, size and mount suit the job. A pattern rejects only part of a neighbour.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a shared spot about 1 m above the heads, or a closer one on the conductor’s side — clear of the mallets and the sightline, then move the mic and see what changes.',
    credit: { scenarios: ['tp.place.1', 'tp.place.2', 'tp.place.3', 'tp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points (switch SET to try the four-drum pairs), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A recommended zone is a place to begin, measured from the heads — not a rule, and not a safety clearance. The number of drums is not a required number of mics.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know when the main pickup already does the job.',
    credit: { scenarios: ['tp.ctx.1', 'tp.ctx.2', 'tp.ctx.studio', 'tp.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Aim nulls by the real pattern; real nulls are shallowest in the lows, where the timpani live. In a recording, the main array often carries the timpani already.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics on one set places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['tp.two.1', 'tp.two.2', 'tp.two.3', 'tp.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay. Two spots are not automatically a stereo pair: judge them with the main array, in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — drum order, distance, the main/spot balance, clearance, gain staging and polarity — before reaching for tone controls or asking the player to change.',
  },
  practice: {
    title: 'Practice',
    goal: 'Add one spot in the right order, choose and justify a setup for two different briefs, and say what would justify a second spot.',
    credit: { scenarios: ['tp.prac.order', 'tp.prac.gain', 'tp.prac.setup1', 'tp.prac.setup2', 'tp.prac.3', 'tp.mix.1', 'tp.mix.2', 'tp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'A justified number and position of mics for the whole passage, every played drum covered, safe clearance, headroom for the loudest roll and an honest mono check pass — and more than one setup can pass.',
  },
};

/* THE CHECKS. Lesson refs (comments only): tp.snd.* L8, L21-22, L24 · tp.set.* L9-10,
 * L46-49 · tp.mic.* L25 · tp.place.* L17-L24 · tp.ctx.* L30-L38 · tp.two.* L39-40 ·
 * tp.prac.* / tp.mix.* L51-57. */
const scenarios: MikingScenario[] = [
  {
    id: 'tp.snd.1',
    page: 'sound',
    prompt: 'Why does a timpani have a clear pitch when most drums do not?',
    options: ['The bowl’s air pulls its main shapes into near-whole-number steps', 'Its head is much thicker than other drumheads, so it rings longer', 'The pedal holds the head perfectly still at a single frequency'],
    correct: 'The bowl’s air pulls its main shapes into near-whole-number steps',
    explain: 'A bare head’s shapes sit at uneven ratios. Over a bowl, the air pulls the timpani’s main (see-saw) shapes toward steps of about 1.5, 2 and 2.5 times the note — close enough to whole-number steps that the ear hears a pitch.',
    why: {
      'Its head is much thicker than other drumheads, so it rings longer': 'Ringing longer is not the same as having a pitch. The bowl’s air sets the ratios between the shapes.',
      'The pedal holds the head perfectly still at a single frequency': 'The pedal sets the head’s tension (its pitch); the head still rings in several shapes at once.',
    },
  },
  {
    id: 'tp.snd.2',
    page: 'sound',
    prompt: 'The mallet strikes the exact centre of a timpani head. What changes?',
    options: ['Only the ring shapes move: more thud, less of the note', 'All of the shapes move equally, so the note gets louder', 'Nothing changes: the strike point does not affect a drum'],
    correct: 'Only the ring shapes move: more thud, less of the note',
    explain: 'The note lives in the see-saw shapes, which are still at the centre. A centre strike drives only the ring shapes — the thud — which is why a timpanist usually plays about a third of the way in from the hoop.',
    why: {
      'All of the shapes move equally, so the note gets louder': 'A shape is driven only as much as the head moves at the strike point; the see-saw shapes do not move at the centre.',
      'Nothing changes: the strike point does not affect a drum': 'The strike point decides which shapes are driven — that is why players choose it.',
    },
  },
  {
    id: 'tp.snd.3',
    page: 'sound',
    prompt: 'Where does a timpani’s sound mostly leave the drum?',
    options: ['From the head, upward and out to the sides', 'From the bottom of the copper bowl', 'From the pedal and the tuning mechanism'],
    correct: 'From the head, upward and out to the sides',
    explain: 'The head moves the air; the bowl holds the air under it and shapes the note. So a mic looking down at the head, or out across it, hears the drum — a tendency, and halls vary.',
    why: {
      'From the bottom of the copper bowl': 'The bowl shapes the pitch by holding the air; the head is what moves the air in the room.',
      'From the pedal and the tuning mechanism': 'The pedal sets the head’s tension; the sound comes from the head.',
    },
  },
  {
    id: 'tp.set.1',
    page: 'setting',
    prompt: 'You are recording an orchestra. Before adding a timpani spot, what do you listen to first?',
    options: ['The main pickup, through the whole passage, at the intended level', 'The timpani on their own, close and soloed, at a high level', 'Nothing yet: timpani in an orchestra need their own spot'],
    correct: 'The main pickup, through the whole passage, at the intended level',
    explain: 'The main array often already carries the timpani’s low notes and the hall. Add a spot only for definition that is missing — never to overwhelm the main sound.',
    why: {
      'The timpani on their own, close and soloed, at a high level': 'Soloed and close tells you least about the orchestra. Start with the main pickup.',
      'Nothing yet: timpani in an orchestra need their own spot': 'Not necessarily: the main pickup may already carry them. A spot is an option, not a default.',
    },
  },
  hearingCheck(W, 'setting', 'tp.set.hear'),
  {
    id: 'tp.set.2',
    page: 'setting',
    prompt: 'A boom over the timpani is safe from the mallets. What else must it keep clear of?',
    options: ['The player’s sightline to the conductor', 'The audience’s view of the copper bowls', 'The brass row, so it hears less of the brass'],
    correct: 'The player’s sightline to the conductor',
    explain: 'The timpanist watches the conductor constantly. Mark the sightline along with the mallets’ sweep, the path round the set and the pedals before placing a stand.',
    why: {
      'The audience’s view of the copper bowls': 'How it looks is not the safety question; the player’s sightline and motion are.',
      'The brass row, so it hears less of the brass': 'Spill matters, but the player must first see the conductor.',
    },
  },
  {
    id: 'tp.mic.1',
    page: 'microphone',
    prompt: 'Is a cardioid condenser the only sensible timpani spot?',
    options: ['No — other mics work when their properties suit the job', 'Yes — no other type can capture the timpani’s low notes', 'Yes — a dynamic would be damaged by the timpani’s level'],
    correct: 'No — other mics work when their properties suit the job',
    explain: 'A cardioid condenser is a common spot, but response, pattern, maximum level, power, size, mount and input headroom decide — not the type’s name.',
    why: {
      'Yes — no other type can capture the timpani’s low notes': 'Other types can capture low notes; compare the real mics’ responses by ear.',
      'Yes — a dynamic would be damaged by the timpani’s level': 'Dynamics handle high levels well; the question is whether its response and pattern suit the job.',
    },
  },
  {
    id: 'tp.mic.2',
    page: 'microphone',
    prompt: 'An omni spot in a good hall: when might it suit the timpani?',
    options: ['When isolation matters less than an open sound', 'When the brass beside them is very loud on stage', 'When the PA must run loud with no hint of feedback'],
    correct: 'When isolation matters less than an open sound',
    explain: 'An omni or wider pattern can suit a good room when isolation is less important. On a loud stage, a directional pattern helps reduce some spill — never all of it.',
    why: {
      'When the brass beside them is very loud on stage': 'An omni hears the brass as well as the timpani; a directional pattern helps more there.',
      'When the PA must run loud with no hint of feedback': 'An omni gives the least rejection; it is not the choice for gain before feedback.',
    },
  },
  {
    id: 'tp.mic.3',
    page: 'microphone',
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power to work', 'The small condenser, if it sits higher above the drums', 'Either one, as long as the channel gain is turned up'],
    correct: 'The small dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits higher above the drums': 'Height does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  },
  {
    id: 'tp.mic.4',
    page: 'microphone',
    prompt: 'A directional spot is aimed at the timpani. Why does it still hear the brass in front?',
    options: ['Real patterns reject only partly, and least at low pitches', 'The brass is louder than the small mic’s maximum rating can take', 'A directional mic hears equally from all around it'],
    correct: 'Real patterns reject only partly, and least at low pitches',
    explain: 'A directional pattern can reduce some spill; it cannot remove all off-axis instruments, and how much it rejects depends on the real pattern and the frequency.',
    why: {
      'The brass is louder than the small mic’s maximum rating can take': 'Spill is not overload: the mic hears the brass because no pattern rejects completely.',
      'A directional mic hears equally from all around it': 'That is an omni. A directional mic rejects part of what is off its axis — never all of it.',
    },
  },
  {
    id: 'tp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A spot close to one head hears more of what, and less of what?',
    options: ['More attack from a small part of the head; less of the note’s bloom', 'More of the note’s full bloom, and less of the mallet’s attack on the head', 'More of the bowl’s air; less of anything the head does'],
    correct: 'More attack from a small part of the head; less of the note’s bloom',
    explain: 'Close to a large head, a mic favours the attack and the part of the head nearest it; the full note blooms over the whole head and the hall. A tendency to check by ear.',
    why: {
      'More of the note’s full bloom, and less of the mallet’s attack on the head': 'The reverse: the bloom needs the whole head and the hall; close in, the attack wins.',
      'More of the bowl’s air; less of anything the head does': 'The head is what moves the air in the room; the bowl holds the air under it.',
    },
  },
  {
    id: 'tp.place.1',
    page: 'placement',
    prompt: 'A starting point says about 1 m above the heads. Your readout says 1 m above the floor. Are you in it?',
    options: ['No — the number counts from the heads, not the floor', 'Yes — 1 m is 1 m, wherever it is measured from', 'Yes, as long as the mic is between the two drums'],
    correct: 'No — the number counts from the heads, not the floor',
    explain: 'A distance only means something with its reference. The heads here sit about 0.76 m up, so 1 m above the floor is only about 25 cm above them — far closer than the starting point.',
    why: {
      'Yes — 1 m is 1 m, wherever it is measured from': 'Same number, wrong reference: from the floor, the mic would sit only about 25 cm above the heads.',
      'Yes, as long as the mic is between the two drums': 'Between the drums is one part; the height counts from the heads.',
    },
  },
  {
    id: 'tp.place.2',
    page: 'placement',
    prompt: 'A set of four drums. How many spot mics does it need?',
    options: ['As many as the music needs — often one per pair, or fewer', 'Four, so that each one of the drums has a mic of its very own', 'Two, because a set of four drums needs a stereo pair'],
    correct: 'As many as the music needs — often one per pair, or fewer',
    explain: 'One shared spot per pair is a common start for four drums; one spot can cover a small set. The number of drums is not a required number of mics.',
    why: {
      'Four, so that each one of the drums has a mic of its very own': 'Each extra mic adds spill and another arrival time. Cover the drums the music uses, as simply as works.',
      'Two, because a set of four drums needs a stereo pair': 'Two spots are not automatically a stereo pair; they cover pairs of drums.',
    },
  },
  {
    id: 'tp.place.3',
    page: 'placement',
    prompt: 'Your shared spot makes the 29 in drum much louder than the 26 in. What is a sensible first change?',
    options: ['Move or re-aim the mic for the two drums, then check the passage', 'Ask the player to hit the 26 in drum a little harder', 'Add a mic for each drum, then balance the two channels'],
    correct: 'Move or re-aim the mic for the two drums, then check the passage',
    explain: 'One drum should not win just because it is nearer. Check the real drum order and usage, then move or angle the mic — a second channel only if it is justified.',
    why: {
      'Ask the player to hit the 26 in drum a little harder': 'The score sets the dynamics; move the mic, not the player.',
      'Add a mic for each drum, then balance the two channels': 'More channels add spill and timing problems; first move the one you have.',
    },
  },
  {
    id: 'tp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Your boom is clear of the mallets. What else do you check with the player?',
    options: ['Their sightline to the conductor and the pedals', 'The colour of the bowls under the stage lights', 'How the stand looks from out in the audience seats'],
    correct: 'Their sightline to the conductor and the pedals',
    explain: 'The timpanist’s space includes the mallets’ sweep, the path round the set, the pedals and the line of sight to the conductor.',
    why: {
      'The colour of the bowls under the stage lights': 'How it looks is not the question; the player’s space and sightline are.',
      'How the stand looks from out in the audience seats': 'Appearance matters less than the player’s sightline and motion.',
    },
  },
  {
    id: 'tp.ctx.1',
    page: 'context',
    prompt: 'An amplified outdoor show. What can push toward a closer, directional timpani spot?',
    options: ['Monitor and PA spill, wind, and gain before feedback', 'A closer mic makes the timpani themselves louder outdoors', 'The hall sound is usually more useful outdoors'],
    correct: 'Monitor and PA spill, wind, and gain before feedback',
    explain: 'Outdoors and amplified, spill, wind and the gain before feedback favour a stable, directional, closer setup — chosen with the PA operator.',
    why: {
      'A closer mic makes the timpani themselves louder outdoors': 'A mic does not change how loud the drum is; it changes what the channel hears.',
      'The hall sound is usually more useful outdoors': 'Outdoors there is no hall to help; that argument belongs to a good indoor room.',
    },
  },
  {
    id: 'tp.ctx.2',
    page: 'context',
    prompt: 'The wedge sits in a supercardioid’s null on paper. What should you expect from a timpani’s low notes?',
    options: ['Less rejection than the picture shows, least in the lows', 'Complete silence from the wedge, low and high alike', 'More rejection in the low notes than in the high ones, by far'],
    correct: 'Less rejection than the picture shows, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — where a timpani’s note lives.',
    why: {
      'Complete silence from the wedge, low and high alike': 'A null is infinitely deep only on paper; real rejection is partial.',
      'More rejection in the low notes than in the high ones, by far': 'The reverse: real patterns usually reject least at low frequencies.',
    },
  },
  {
    id: 'tp.ctx.studio',
    page: 'context',
    prompt: 'Recording in a good hall. The timpani’s notes sound full in the main pair. What could still justify a spot?',
    options: ['Missing articulation in a passage the score features', 'A spot is needed just so the timpani appear on a channel', 'The main pair hears too much of the hall’s sound'],
    correct: 'Missing articulation in a passage the score features',
    explain: 'A spot is added for what is missing — definition in a featured passage — and blended so the drums stay in their place in the orchestra.',
    why: {
      'A spot is needed just so the timpani appear on a channel': 'A channel is not a reason; a spot adds spill and arrival times, so it has to earn its place.',
      'The main pair hears too much of the hall’s sound': 'That would be a main-pair question; a timpani spot does not fix it.',
    },
  },
  {
    id: 'tp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The timpanist strikes the head dead centre in one passage. What do you expect?',
    options: ['More thud and less of the note — the player’s choice', 'A brighter attack that the spot mic exaggerates', 'No difference from striking near the hoop'],
    correct: 'More thud and less of the note — the player’s choice',
    explain: 'A centre strike drives only the ring shapes: more thud, less sustained note. It is a musical choice — never ask a player to change the strike point for a mic.',
    why: {
      'A brighter attack that the spot mic exaggerates': 'A centre strike gives a duller thud, not a brighter attack.',
      'No difference from striking near the hoop': 'The strike point decides which shapes ring; centre and edge sound different.',
    },
  },
  polarityKeepsDelay(W),
  firstNotch(W),
  {
    id: 'tp.two.3',
    page: 'twoMic',
    prompt: 'Two timpani spots are up. Should they be panned hard left and right as a stereo pair?',
    options: ['Not by default: pan them for coverage and the orchestra’s image', 'Yes — two spots on one set are a stereo pair by nature', 'Yes, and keep the main pair turned down whenever both spots play'],
    correct: 'Not by default: pan them for coverage and the orchestra’s image',
    explain: 'Two spots usually cover pairs of drums; their job is coverage and tonal control. Place them where the timpani sit in the ensemble image, and check them in mono with the main pair.',
    why: {
      'Yes — two spots on one set are a stereo pair by nature': 'They are not spaced or angled as a pair; they cover different drums.',
      'Yes, and keep the main pair turned down whenever both spots play': 'The main pair carries the orchestra; spots are blended under it.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'tp.prac.3',
    page: 'practice',
    prompt: 'What would justify a second timpani spot on a set of four?',
    options: ['The music uses both pairs and one spot cannot cover them well', 'Four drums should have at least two mics, for the sake of symmetry', 'The timpani need more level than one spot can give'],
    correct: 'The music uses both pairs and one spot cannot cover them well',
    explain: 'Scale up only as needed: compare two shared spots with one, check their overlap and the mono sum, and keep the second only if it earns its place.',
    why: {
      'Four drums should have at least two mics, for the sake of symmetry': 'Symmetry is not a reason: the drum count is not a required mic count.',
      'The timpani need more level than one spot can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tp.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 1 m”. Before you place the mic, what else do you need to know?',
    options: ['What it is measured from, and where between the drums it sits', 'The brand of the timpani, so the number matches their size', 'Nothing more: the number already tells you exactly where it goes'],
    correct: 'What it is measured from, and where between the drums it sits',
    explain: 'A distance belongs to its reference (here, the heads), and a starting point may name a position (“between two drums”). Clearance and sightline are separate checks.',
    why: {
      'The brand of the timpani, so the number matches their size': 'The brand does not change the reference; the heads do.',
      'Nothing more: the number already tells you exactly where it goes': 'A distance means nothing without its reference; position and clearance are separate checks.',
    },
  },
  cardioidNull(W),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'tp.s.one',
    observation: 'One drum dominates the shared spot',
    firstChecks: 'The real drum order, distances, aim and which drums the score uses.',
    options: ['The drum order, the distances, the aim and the score', 'Ask the player to play the louder drum more softly', 'Add a mic for the quieter drum first, before anything else'],
    correct: 'The drum order, the distances, the aim and the score',
    explain: 'Reposition for the two drums and recheck the whole phrase; add a second channel only if it is justified.',
    why: {
      'Ask the player to play the louder drum more softly': 'The score sets the dynamics; move the mic, not the player.',
      'Add a mic for the quieter drum first, before anything else': 'More channels add spill and timing problems; move the shared spot first.',
    },
  },
  {
    id: 'tp.s.thin',
    observation: 'The attack is clear but the pitch and bloom are thin',
    firstChecks: 'Does the main array carry the low note? Is the spot too loud or too close?',
    options: ['The main/spot balance, and how close the spot is', 'Boost the low end on the spot until the note returns', 'Ask the player to use softer mallets in this passage'],
    correct: 'The main/spot balance, and how close the spot is',
    explain: 'Lower the spot or move it safely farther away, and let the main array carry the bloom; the mallets and the tone are the player’s to choose.',
    why: {
      'Boost the low end on the spot until the note returns': 'EQ cannot put back a bloom a too-close mic does not hear; rebalance first.',
      'Ask the player to use softer mallets in this passage': 'Mallets are a musical choice; adjust the mic and the balance first.',
    },
  },
  {
    id: 'tp.s.mech',
    observation: 'A mechanical knock or an unexpected pitch',
    firstChecks: 'Whether a stand or cable touches the instrument, and the pedal moves; have the timpanist check the drum.',
    options: ['Contact between hardware and drum, then the player checks it', 'Retune the drum yourself with the T-handles to fix it', 'Gate the spot so that the knock is cut out between the strokes'],
    correct: 'Contact between hardware and drum, then the player checks it',
    explain: 'Stop and find any contact first. The drum, its tuning and its pedal are the timpanist’s to inspect — never retune or move them yourself.',
    why: {
      'Retune the drum yourself with the T-handles to fix it': 'Never retune a player’s drum; ask the timpanist.',
      'Gate the spot so that the knock is cut out between the strokes': 'A gate hides the symptom; find the contact first.',
    },
  },
  distortionSymptom(W),
  monoSymptom(W),
  contactSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the heads', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const COUNT_REASON: SetupReason = { id: 'r.count', label: 'Every drum should have its own mic, whatever the music', role: 'wrong', feedback: 'The number of drums is not a required number of mics.' };

const setupTasks: SetupTask[] = [
  {
    id: 'tp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A symphony recording in a good hall, two timpani. The rolls sound a little soft in definition; the main pair is up. One spot channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 1 m above the heads, between the two drums, blended low', ok: true, power: 'phantom', feedback: 'A recommended shared spot for a pair; it needs the phantom power this channel has.' },
      { id: 'b', label: 'Small dynamic on the conductor’s side of the larger drum, a little above its rim, aimed at the head', ok: true, power: 'none', feedback: 'A closer spot for definition; check that both drums are covered and blend it low.' },
      { id: 'c', label: 'A mic on each drum, close over the playing area', ok: false, power: 'phantom', feedback: 'Over the playing area is in the mallets’ path, and two mics were not asked for.' },
      { id: 'd', label: 'A stand between the player and the conductor, at eye height', ok: false, power: 'phantom', feedback: 'That blocks the timpanist’s sightline to the conductor.' },
      { id: 'e', label: 'A mic clamped to a counterhoop without asking', ok: false, power: 'none', feedback: 'Nothing is mounted on the instrument without compatible hardware and the owner’s agreement.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.blend', label: 'Blended under the main pair, it adds definition without moving the drums', role: 'optional', feedback: 'A fair recording reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from the heads, clear of the mallets and the sightline, power that matches the mic, and a gentle blend.',
  },
  {
    id: 'tp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An amplified outdoor concert, four timpani, a loud brass section in front. The PA operator needs usable timpani channels. The spare inputs have NO phantom power.',
    setups: [
      { id: 'a', label: 'Two small dynamics, one about 1 m above each pair, between its drums', ok: true, power: 'none', feedback: 'One shared spot per pair; dynamics need no phantom. Check their overlap in mono.' },
      { id: 'b', label: 'One small dynamic above the middle pair, checked to cover all four drums', ok: true, power: 'none', feedback: 'One spot can be enough if it really covers the passage — check the outer drums.' },
      { id: 'c', label: 'Two small condensers, one over each pair', ok: false, power: 'phantom', feedback: 'These inputs have no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Four mics, one over each head, panned left to right', ok: false, power: 'none', feedback: 'The drum count is not a required mic count, and close over the heads is in the mallets’ path.' },
      { id: 'e', label: 'No spot: rely on the open air to carry the drums', ok: false, power: 'none', feedback: 'The operator needs channels, and outdoors no hall helps a distant pickup.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Directional spots help against brass spill, wind and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, COUNT_REASON],
    explain: 'Two setups pass. What passes is the reasoning: shared spots from the heads, scaled to what the music needs, clear of the player, and powered by what these inputs can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the mallet strikes the head a third of the way in from the hoop. What does the far side of the head do?', options: ['It moves up while the struck side goes down', 'It moves down with the struck side', 'It stays still — only the struck side moves'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the whole head.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move from the shared spot high between the drums to a closer spot on one drum. What changes?', options: ['More of both drums', 'More attack from one drum', 'It depends on the hall and the passage'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits off to the side of a mic looking down at a drum. Which pattern can turn a null toward it?', options: ['Only a cardioid', 'A supercardioid or hypercardioid', 'None of them'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'tp.q.1',
    covers: 'instrument',
    prompt: 'What does pressing a timpani’s pedal do?',
    options: ['Tightens the head, raising its pitch', 'Damps the head, so that it stops ringing', 'Tilts the drum toward the player'],
    correct: 'Tightens the head, raising its pitch',
    explain: 'On pedal timpani, pressing the pedal tightens the head and raises the pitch; players retune with it during a piece.',
    why: {
      'Damps the head, so that it stops ringing': 'Damping is done by hand; the pedal changes the head’s tension.',
      'Tilts the drum toward the player': 'The pedal works the head’s tension, not the drum’s angle.',
    },
  },
  {
    id: 'tp.q.2',
    covers: 'instrument',
    prompt: 'A set of two timpani in the international order: where is the larger drum?',
    options: ['On the player’s left', 'On the player’s right', 'Out in front of the player, in a row'],
    correct: 'On the player’s left',
    explain: 'In the international order pitch rises from left to right, so the larger (lower) drum is on the player’s left; a German set is mirrored. Check the real order with the player.',
    why: {
      'On the player’s right': 'That is the German order. The international order puts the larger drum on the left.',
      'Out in front of the player, in a row': 'The drums sit side by side in front of the player, larger on the left (international).',
    },
  },
  {
    id: 'tp.q.3',
    covers: 'sound',
    prompt: 'Why does a timpanist usually strike about a third of the way in from the hoop, not the centre?',
    options: ['It drives the pitched shapes well; the centre gives mostly thud', 'The centre of a timpani head is much too hard to strike cleanly', 'It keeps the mallet away from the tuning pedal mechanism'],
    correct: 'It drives the pitched shapes well; the centre gives mostly thud',
    explain: 'The note lives in the see-saw shapes, still at the centre; a centre strike drives only the ring shapes — more thud, less note.',
    why: {
      'The centre of a timpani head is much too hard to strike cleanly': 'The centre can be struck; it just drives the wrong shapes for the note.',
      'It keeps the mallet away from the tuning pedal mechanism': 'The pedal is under the drum; the strike point is about which shapes ring.',
    },
  },
  {
    id: 'tp.q.4',
    covers: 'sound',
    prompt: 'What does the air in the copper bowl do to a timpani’s sound?',
    options: ['Pulls the main shapes into near-whole-number steps — a pitch', 'Makes the drum much louder, like a megaphone pointed at the floor', 'Nothing — the bowl only holds the head up'],
    correct: 'Pulls the main shapes into near-whole-number steps — a pitch',
    explain: 'The enclosed air pushes back on the head and shifts its shapes’ pitches toward near-harmonic steps, which the ear hears as a note.',
    why: {
      'Makes the drum much louder, like a megaphone pointed at the floor': 'The bowl is closed above by the head; its air shapes the ratios, not the loudness.',
      'Nothing — the bowl only holds the head up': 'Its air changes how the head vibrates — that is where the pitch comes from.',
    },
  },
  {
    id: 'tp.q.5',
    covers: 'setting',
    prompt: 'Recording an orchestra: before adding a timpani spot, what comes first?',
    options: ['Hear the passage through the main pickup', 'Put a close mic on each drum in case', 'Ask the player to play louder for the mics'],
    correct: 'Hear the passage through the main pickup',
    explain: 'The main array often carries the timpani already. A spot is added for definition that is missing.',
    why: {
      'Put a close mic on each drum in case': 'A spot is an option, not a default; one per drum adds spill and timing problems.',
      'Ask the player to play louder for the mics': 'The score sets the dynamics; the mics serve the music.',
    },
  },
  quickHearing(W),
];

export const M06_LESSON: Lesson = {
  id: 'M06',
  labId: 'drums',
  title: 'Timpani',
  subtitle: 'Kettledrums: the main pickup, a shared spot, two drums or four',
  noun: { one: 'timpani', many: 'timpani' },
  model: TIMP_MODEL,
  micTypeIds: ['orchSdc', 'smallDynCard'],
  zones: TIMP_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    setupOrder(W, { text: 'Map the passage with the player: drums, pedals, mallets, sweep, sightline', early: 'Start with the player and the music.' }, { text: 'Listen to the main pickup and decide what, if anything, is missing', early: 'Hear what the main pickup gives before you add a mic.' }),
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Timpani (kettledrums) are pitched drums: one head stretched over a copper bowl. Pressing a drum’s pedal tightens its head and raises its pitch, so a player can retune during a piece.', src: 'YMH-TIMP-MECH' },
    { title: 'WHERE YOU MEET THEM', text: 'At the back of the orchestra and the concert band, in sets of two to five drums placed together — recorded in halls and studios, and sometimes amplified on stage or outdoors.', src: 'YMH-TIMP-RNG' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'Pitched notes that bloom and ring, rolls from very quiet to very loud, and accents that drive the orchestra. Mallets, strike point, damping and the pedal are all part of the player’s interpretation.', src: 'LESSON-TIMP' },
    { title: 'THEIR SIZE', text: 'Timpani are about 50 to 80 cm across; a 29 in and a 26 in drum are a common first pair, with a 32 in and a 23 in added for a set of four. This lab draws that pair, and the set of four.', src: 'YMH-TIMP-SEL' },
  ],
  sound: {
    stages: [
      { title: 'The mallet strikes', text: 'A mallet strikes the head about a third of the way in from the hoop, on the player’s side. That brief contact is where the ATTACK begins.' },
      { title: 'The head see-saws', text: 'The head goes down where it was struck and up on the far side — its (1,1) see-saw shape, drawn much larger than it really moves. This shape and its relatives carry the NOTE.' },
      { title: 'The bowl’s air is shoved across', text: 'The air under the head is shoved from one side of the bowl to the other rather than squeezed. Pushing back on the head, it pulls the head’s pitched shapes into near-whole-number steps: that is why a timpani has a clear pitch.' },
      { title: 'Sound leaves the head', text: 'Sound leaves from the head — upward and out to the sides; the bowl holds the air under it. The note blooms and rings on: how long depends on the mallet, the tuning and any damping.' },
    ],
    attack: 'The start of each stroke: the mallet’s brief contact with the head, on the player’s side. A mic close to the head tends to hear more of it — and of the part of the head nearest the mic.',
    body: 'The note that rings after: the head’s pitched shapes over the bowl’s air, blooming over the whole head and into the hall. A mic farther away, or the main pickup, tends to hear more of that bloom. Both are tendencies, and drums and halls vary.',
    head: { diameterMm: 29 * 25.4, rods: 8, label: '29 in timpani head, seen from above', strikeSrc: 'YMH-TIMP-STRIKE', hoop: 'metal', shapes: 'kettle' },
  },
  setting: {
    items: [
      { id: 'timpani', label: 'the timpani (and their player)', short: 'TIMPANI', note: 'At the back of the orchestra, the player behind the drums facing the conductor. The drawing every page of this lesson uses.', prov: { kind: 'illustrative', reason: 'a typical concert layout; no source gives positions' }, tag: 'THE DRUMS', scene: 'all' },
      { id: 'bassDrum', label: 'the concert bass drum', short: 'BASS DRUM', note: 'Another big, low drum along the row. A timpani spot hears it — and the bass drum’s mics hear the timpani.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'snare', label: 'the concert snare', short: 'SNARE', note: 'Crisp and loud further along the row; part of what every percussion mic hears.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'cymbal', label: 'a suspended cymbal', short: 'CYMBAL', note: 'Bright and loud. A directional spot rejects only part of it.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'brass', label: 'the brass row in front', short: 'BRASS', note: 'Trombones and tuba just downstage of the timpani, bells toward the conductor. Loud, and heard by every timpani mic — one reason a more distant spot admits more bleed.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'downstage', label: 'a floor wedge downstage of the timpani', short: 'WEDGE', note: 'On the audience side of the drums, facing back toward the percussion. A loud source a spot can turn its rejection toward.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill', label: 'the percussion section’s own monitor', short: 'SECTION MON.', note: 'Behind the timpanist, facing them. A spot aimed at the drums faces it — no pattern rejects it there.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'conductor', label: 'the conductor', short: 'CONDUCTOR', note: 'At the front, facing the orchestra. The timpanist watches the conductor constantly: no stand or boom across that sightline.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SIGHTLINE', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Every open mic also hears it — low notes most of all.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'FEEDBACK PATH', scene: 'stage' },
      { id: 'main', label: 'the main pair over the conductor', short: 'MAIN PAIR', note: 'Two mics on a tall stand, hearing the whole orchestra. Recording, it often carries the timpani’s low notes and the hall already.', prov: { kind: 'illustrative', reason: 'a typical recording layout' }, tag: 'MAIN PICKUP', scene: 'studio' },
      { id: 'hall', label: 'the hall', short: 'THE HALL', note: 'In a good hall, the room carries the note’s bloom. Timing between a spot and the main pair decides whether added definition helps.', prov: { kind: 'illustrative', reason: 'a generic hall; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: an amplified orchestra — monitors on stage, the PA facing the audience, maybe outdoors. Spill, wind and the gain before feedback can push toward a closer, directional spot, worked out with the PA operator.',
    studio: 'RECORDING: the main pair carries the orchestra and the hall, and there are no monitors. A timpani spot is blended under it only where definition is missing.',
  },
  diagnostic,
  practice: {
    task: 'Justify the number and position of mics for a complete passage — main only, one shared spot or more — cover every drum played, check the sum in mono, and explain why the live setup may differ. With real timpani and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'set', label: 'Set (sizes and order)', kind: 'text' },
      { id: 'mics', label: 'Mics', kind: 'choice', choices: ['main pickup only', 'one shared spot', 'one spot per pair', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'height', label: 'Height above the heads, aim', kind: 'text' },
      { id: 'clear', label: 'Clearances checked (mallets, pedals, sightline)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The head height above the floor (drawn at 760 mm) and the pair’s spacing (±380 mm) — drawing defaults; no height above the floor is shown.', dims: ['headH', 'pairZ'] },
    { text: 'The bowl’s shape and depth, the counterhoop, the rod count (drawn 8), the suspension ring, the legs and the pedals — drawing defaults (shared/concert/timpanoSpec.ts).', dims: [] },
    { text: 'The four-drum set’s positions (an arc, 32 and 23 in set 150 mm back) — a drawing default.', dims: [] },
    { text: 'The mallets’ reach (420 mm above the heads, 200 mm past the rim on the player’s side) and the player’s position — ILLUSTRATIVE.', dims: [] },
    { text: 'The aim of the shared spot (the source gives none: the lab accepts within 60° of straight down) and its ±15 cm band.', dims: [] },
  ],
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge downstage of the timpani, facing back toward them',
        short: 'DOWNSTAGE',
        p: { x: 1000, y: 0, z: 700 },
        lift: 150,
        faces: { x: -1, y: 0, z: -0.4 },
        note: 'It sits on the audience side, off to the side of a spot looking down at the drum — a case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the percussion section’s own monitor, behind the timpanist, facing them',
        short: 'SECTION MON.',
        p: { x: -1150, y: 0, z: 0 },
        lift: 150,
        faces: { x: 1, y: 0, z: 0 },
        note: 'It sits behind the player, in FRONT of a spot aimed at the drums: no pattern null reaches it.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. In an orchestra the main pickup often carries the timpani already; when a spot helps, every set, player and hall is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a pair (or four) of timpani, ideal head shapes with a timpani’s ratios, mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: TIMP_COPY,
};
