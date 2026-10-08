/**
 * A11 ACCORDION — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Accordion-Miking-Technique.txt; "L<n>" in
 * comments only), research in docs/labs/miking/accordion/, corrections in
 * CORRECTIONS_LOG.md (AC-01 …). Owner ruling 2026-10-04: suggested starting
 * points, no sources, brands or badges on screen. FULLY SILENT: the reeds
 * and the bellows are shown, never played.
 *
 * Two moving sides: the treble side stays on the player's chest, the bass
 * side moves with the bellows (the variants: closed, half open, fully open).
 * Every stand stays outside the bellows' whole travel.
 */
import type { DiagnosticItem, Lesson, MikingScenario, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, PLAYER_REASON, POWER_REASON, polarityKeepsDelay } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, quickHearing, setupOrder, type ReedWords } from '../shared/freereed/freeReedItems.ts';
import { A11_MODEL, A11_WEDGES, A11_ZONES } from './geometry.ts';

const W: ReedWords = { p: 'ac', the: 'the accordion', player: 'player', loudest: 'the loudest passage' };
const MW = { ...W, tail: 'the end of the chord' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the accordion',
    goal: 'Get to know the accordion — what it is, where you meet it, what each side does in the music, its parts and how its bass side moves — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A reed instrument worn on the chest: a treble side with a keyboard for the right hand, a bass side with buttons for the left, and the bellows between them. Both sides sound — and the bass side moves.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how the bellows’ air becomes sound — reeds swinging through their slots, chopping the air into puffs — and how it leaves from both sides while one of them moves.',
    credit: { scenarios: ['ac.snd.1', 'ac.snd.2', 'ac.snd.3'], interactive: 'soundPath', note: 'Step the reed through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bellows move air through the reeds; each reed swings through its slot and lets the air through in puffs — the notes. The treble sounds out through the grille, the bass through the bass side, and the bass side moves with every push and pull.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the accordion sits — the player and the bellows’ travel, a stage and a studio — and what to do before any mic.',
    credit: { scenarios: ['ac.set.1', 'ac.set.hear', 'ac.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Watch a full passage with the bellows at full stretch; ask which sides the music needs and how the player stands or moves. Nothing goes on the instrument without the player’s agreement. Protect hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic by its properties — pattern, power, size and mount — for the view you want: one stand mic for the whole instrument, one for each side, or a mount that moves with a side.',
    credit: { scenarios: ['ac.mic.1', 'ac.mic.2', 'ac.mic.3', 'ac.mic.4', 'ac.rec.1'], note: 'Answer the five checks (one reaches back to how the accordion sounds).' },
    takeaway: 'An omni can integrate both sides in a quiet room; a directional mic helps on a stage. A miniature on a mount made for the instrument moves with its side. Check the real pattern, the adapter and the power — not the connector’s shape.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic about 30–60 cm in front, centred; or a mic for each side — always outside the bellows’ whole travel; then switch BELLOWS and see the bass side move.',
    credit: { scenarios: ['ac.place.1', 'ac.place.2', 'ac.place.3', 'ac.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the bellows’ travel and the player, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'One mic about 30–60 cm in front, centred, integrates the two sides. A treble mic about 30 cm from the keyboard side and a bass mic just beyond the fully open bass side give separate control — but the bass side’s distance changes all through the cycle.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its rejection faces a loud monitor — and know what a moving bass side and a mounted mic change on a stage.',
    credit: { scenarios: ['ac.ctx.1', 'ac.ctx.2', 'ac.ctx.studio', 'ac.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live: the fewest open channels, the loudspeakers out of each mic’s strongest pickup, levels raised gradually; check the bass side’s position near any monitor separately. Studio: one mic first; add a side only if it matters.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'A treble mic and a bass mic: see the delay between them change as the bellows move, what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['ac.two.1', 'ac.two.2', 'ac.two.3', 'ac.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks. Switch BELLOWS to see the bass side’s delay move.' },
    takeaway: 'The moving sides change each mic’s distance to each side, so no fixed delay or polarity setting holds for the whole phrase. Solo, sum in mono over full opening and closing phrases, and move or rebalance if it hollows.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement and movement first: the side the mic favours, the bellows’ travel, the mechanism noise, the filter, the geometry near monitors — before EQ. A cable that catches the bellows is a stop.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['ac.prac.order', 'ac.prac.gain', 'ac.prac.setup1', 'ac.prac.setup2', 'ac.prac.3', 'ac.mix.1', 'ac.mix.2', 'ac.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Keep every stand and cable outside the bellows’ travel, choose one integrated view or a mic per side on purpose, leave headroom for the loudest passage, and judge any pair in mono over full bellows strokes.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L6 · set L7, L38 · mic L30, L37-L38 · place L25-L29, L34 ·
 * ctx L41-L42, L33 · two L34 · prac L35, L72-L74. */
const scenarios: MikingScenario[] = [
  {
    id: 'ac.snd.1',
    page: 'sound',
    prompt: 'What moves the air through the accordion’s reeds?',
    options: ['The bellows, pushed and pulled by the left arm', 'The player’s breath, blown in through a mouthpiece', 'A small electric fan inside the treble side'],
    correct: 'The bellows, pushed and pulled by the left arm',
    explain: 'The bellows are the air source: pulling and pushing them draws air through the reed blocks to the reeds whose keys or buttons are pressed.',
    why: {
      'The player’s breath, blown in through a mouthpiece': 'That is the harmonica. An accordion’s air comes from its bellows.',
      'A small electric fan inside the treble side': 'An acoustic accordion has no fan: the arm works the bellows.',
    },
  },
  {
    id: 'ac.snd.2',
    page: 'sound',
    prompt: 'Where does an accordion’s sound leave it?',
    options: ['Both sides: the treble grille and the bass end', 'Only the grille on the treble side, nowhere else', 'Mostly from the gaps between the bellows’ folds'],
    correct: 'Both sides: the treble grille and the bass end',
    explain: 'The treble reeds sound out through the grille and the bass reeds through the bass side — each with its own timbre. That is why one close mic can miss a side.',
    why: {
      'Only the grille on the treble side, nowhere else': 'The bass side sounds too — the bass notes and chords come from there.',
      'Mostly from the gaps between the bellows’ folds': 'The bellows are the air source; a mic pointed into their gap is not a default way to hear the instrument.',
    },
  },
  {
    id: 'ac.snd.3',
    page: 'sound',
    prompt: 'On a diatonic button accordion, one button gives a different note on push and pull. Why?',
    options: ['Each button has a push reed and a pull reed', 'The bellows bend the one reed’s pitch as they move', 'Pushing tunes that same reed down a whole step'],
    correct: 'Each button has a push reed and a pull reed',
    explain: 'The air flows one way on a push and the other on a pull; a diatonic instrument gives each direction its own reed and note. A piano accordion keeps the same note both ways.',
    why: {
      'The bellows bend the one reed’s pitch as they move': 'A reed’s pitch is set by the reed; the direction chooses which reed sounds.',
      'Pushing tunes that same reed down a whole step': 'Pressure does not retune a reed by a step: a different reed sounds.',
    },
  },
  {
    id: 'ac.set.1',
    page: 'setting',
    prompt: 'Before placing a mic, what do you watch the accordionist play?',
    options: ['A full passage, with the bellows at full stretch', 'One held chord, so the level stays steady', 'Nothing yet: set the mic, then fit the playing round it'],
    correct: 'A full passage, with the bellows at full stretch',
    explain: 'Low bass, full chords, the treble melody, opening and closing strokes, the softest and loudest passage — and how far the bass side travels. Never make the player constrain their technique for a stand.',
    why: {
      'One held chord, so the level stays steady': 'A held note hides the bellows’ travel and the bass side’s movement.',
      'Nothing yet: set the mic, then fit the playing round it': 'Never fit the player round a mic: place the mic for the player.',
    },
  },
  hearingCheck(W),
  {
    id: 'ac.set.2',
    page: 'setting',
    prompt: 'The player asks you to clip a mic to the bellows. What do you say?',
    options: ['Only a mount made for it, on a side, with their OK', 'Yes — tape it on, so it moves with the air flow', 'Yes, as long as the cable runs through the folds'],
    correct: 'Only a mount made for it, on a side, with their OK',
    explain: 'Use hardware made for the instrument, with the player’s consent; never tape a grille, drill, compress a strap, block the air button or run a cable through the bellows.',
    why: {
      'Yes — tape it on, so it moves with the air flow': 'Tape and the bellows’ folds do not mix — and taping the instrument can damage it.',
      'Yes, as long as the cable runs through the folds': 'A cable through the bellows is a stop condition, not a route.',
    },
  },
  {
    id: 'ac.mic.1',
    page: 'microphone',
    prompt: 'Why might an omni suit a solo accordion in a quiet room?',
    options: ['It takes in both sides and the room evenly', 'It rejects the room better than a cardioid', 'It needs no power, unlike a cardioid'],
    correct: 'It takes in both sides and the room evenly',
    explain: 'An accordion radiates from both sides; an omni can integrate a multi-directional source in a quiet room. It does not give stage isolation.',
    why: {
      'It rejects the room better than a cardioid': 'An omni hears the room all round — more of it, not less.',
      'It needs no power, unlike a cardioid': 'Power depends on the transducer, not the pattern.',
    },
  },
  {
    id: 'ac.mic.2',
    page: 'microphone',
    prompt: 'On a loud stage, why not reach for an omni on the accordion?',
    options: ['It hears the stage and monitors all round', 'It cannot pick up the bass side at all', 'It distorts on the accordion’s bass notes'],
    correct: 'It hears the stage and monitors all round',
    explain: 'An omni gives no rejection: on a loud stage it hears the monitors and the band. A directional mic helps when spill and feedback matter — check its real pattern.',
    why: {
      'It cannot pick up the bass side at all': 'An omni hears all round; its problem live is spill and feedback.',
      'It distorts on the accordion’s bass notes': 'Pattern says nothing about distortion; check the max SPL.',
    },
  },
  {
    id: 'ac.mic.3',
    page: 'microphone',
    prompt: 'A miniature mic mounted on the bass side. What does it do as the bellows move?',
    options: ['It moves with that side: its distance stays the same', 'It stays still in place while the bass side moves away', 'It hears the treble side more on each pull'],
    correct: 'It moves with that side: its distance stays the same',
    explain: 'A mount follows its side, helping a player who walks or turns. It sits close, so it also reveals more of the keys and the bellows’ mechanism.',
    why: {
      'It stays still in place while the bass side moves away': 'That is a stand mic. A mount rides on the side.',
      'It hears the treble side more on each pull': 'On a pull it moves away from the treble side with the bass side.',
    },
  },
  {
    id: 'ac.mic.4',
    page: 'microphone',
    prompt: 'A miniature mic’s connector fits your bodypack. Is that proof they work together?',
    options: ['Not yet: check the adapter and the powering', 'Yes — a connector that fits means it will work', 'Yes, as long as both are condenser mics'],
    correct: 'Not yet: check the adapter and the powering',
    explain: 'Similar-looking connectors do not prove interchangeability. Check the exact mic’s adapter, its powering and the bodypack in their manuals.',
    why: {
      'Yes — a connector that fits means it will work': 'Pins can match while the wiring and the power differ.',
      'Yes, as long as both are condenser mics': 'Condensers differ in voltage and wiring; check the manuals.',
    },
  },
  {
    id: 'ac.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why can a close mic on one side miss part of the music?',
    options: ['The other side plays the other part', 'The bellows block the sound behind them', 'Close mics hear only the lowest notes'],
    correct: 'The other side plays the other part',
    explain: 'The treble side plays the melody and the bass side the bass notes and chords. A close mic favours the nearest side; check the part the music needs.',
    why: {
      'The bellows block the sound behind them': 'Both sides radiate outward; it is distance and angle that favour one.',
      'Close mics hear only the lowest notes': 'Closeness favours the nearer side, not a register.',
    },
  },
  {
    id: 'ac.place.1',
    page: 'placement',
    prompt: 'A starting point says about 30–60 cm in front, centred. Centred on what?',
    options: ['The middle between the two sides', 'The treble grille, where the melody is', 'The bellows’ folds, the air source'],
    correct: 'The middle between the two sides',
    explain: 'In front and centred between treble and bass, so the two combine; then move toward the side the music needs.',
    why: {
      'The treble grille, where the melody is': 'That favours the melody; centred combines both sides.',
      'The bellows’ folds, the air source': 'Pointing into the bellows is not a default way to hear the instrument.',
    },
  },
  {
    id: 'ac.place.2',
    page: 'placement',
    prompt: 'At a fixed stand mic, the bass level rises and falls with the bellows. Why?',
    options: ['The bass side moves toward and away from it', 'The bellows open and close the bass reeds’ valves', 'The mic’s pattern changes as the air moves'],
    correct: 'The bass side moves toward and away from it',
    explain: 'The bass side travels with every push and pull, so its distance to a fixed mic changes. Watch the full travel; move, widen the view or mount a bass-side mic.',
    why: {
      'The bellows open and close the bass reeds’ valves': 'The level change follows the distance, which changes as the side moves.',
      'The mic’s pattern changes as the air moves': 'The pattern stays; the source moves.',
    },
  },
  {
    id: 'ac.place.3',
    page: 'placement',
    prompt: 'Where is the bellows-side starting point measured from?',
    options: ['The bass side at its fullest opening', 'The bass side when the bellows are closed', 'The middle of the bellows’ folds'],
    correct: 'The bass side at its fullest opening',
    explain: 'Measured from the bass side at its full opening, the stand stays outside the whole travel; on a push the side moves away from the mic.',
    why: {
      'The bass side when the bellows are closed': 'Then the bass side would reach the stand on a full pull.',
      'The middle of the bellows’ folds': 'The bellows move; the reference is the side at its fullest opening.',
    },
  },
  {
    id: 'ac.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A stand just clears the bass side while the bellows are closed. Is that safe?',
    options: ['No — the bass side moves out on every pull', 'Yes — the bass side stays where it is', 'Yes, if its cable is taped to the floor'],
    correct: 'No — the bass side moves out on every pull',
    explain: 'Watch a full passage with maximum bellows extension and keep every stand, cable and clip outside that travel — and clear of the elbows and straps.',
    why: {
      'Yes — the bass side stays where it is': 'It moves with every push and pull.',
      'Yes, if its cable is taped to the floor': 'Taping the cable does not move the stand out of the travel.',
    },
  },
  {
    id: 'ac.ctx.1',
    page: 'context',
    prompt: 'Live, the bass side swings toward a side-fill monitor on every pull. What do you do?',
    options: ['Check that position separately and set levels for it', 'Ignore it, since the side-fill sits behind the player', 'Turn the side-fill up so the player can hear more'],
    correct: 'Check that position separately and set levels for it',
    explain: 'If the bass side — or a mic on it — moves toward a monitor, evaluate that position on its own and raise levels gradually during a real passage.',
    why: {
      'Ignore it, since the side-fill sits behind the player': 'A moving side can bring its mic closer to the monitor.',
      'Turn the side-fill up so the player can hear more': 'More level there brings feedback closer.',
    },
  },
  {
    id: 'ac.ctx.2',
    page: 'context',
    prompt: 'A mount rides on the bass side. Will it hear more key and bellows noise than a stand mic?',
    options: ['Yes — it sits closer to the mechanism', 'No — a mount filters the mechanism out', 'No, the bellows shield it from the keys'],
    correct: 'Yes — it sits closer to the mechanism',
    explain: 'A closer, instrument-mounted mic improves direct sound against spill, but reveals more of the keys and the bellows. Compare it with an external view.',
    why: {
      'No — a mount filters the mechanism out': 'A mount holds the mic; it does not filter anything.',
      'No, the bellows shield it from the keys': 'It sits on the moving side, close to the buttons and the bellows.',
    },
  },
  {
    id: 'ac.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A solo accordion in a good room. Where do you start?',
    options: ['One mic 30–60 cm in front, then compare', 'Two mics on the two sides, hard left and right', 'A mic pointed into the bellows’ gap'],
    correct: 'One mic 30–60 cm in front, then compare',
    explain: 'Find a place in the room where the parts combine, then compare nearer the treble and farther integrated positions. Add a side mic only if its contribution matters.',
    why: {
      'Two mics on the two sides, hard left and right': 'Two channels are a balance decision, not an automatic hard stereo pair.',
      'A mic pointed into the bellows’ gap': 'The bellows are the air source, not a default view of the instrument.',
    },
  },
  {
    id: 'ac.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which side carries the melody on a piano accordion?',
    options: ['The treble side, under the right hand', 'The bass side, under the left hand', 'The bellows, between the two hands'],
    correct: 'The treble side, under the right hand',
    explain: 'The right hand plays the treble keyboard — usually the melody; the left plays bass notes and chords on the buttons.',
    why: {
      'The bass side, under the left hand': 'The bass side plays the accompaniment: bass notes and chords.',
      'The bellows, between the two hands': 'The bellows move the air; they play no notes.',
    },
  },
  polarityKeepsDelay(MW),
  firstNotch(W),
  {
    id: 'ac.two.3',
    page: 'twoMic',
    prompt: 'A treble mic and a bass mic sound hollow in mono on some passages. Why can’t a fixed delay fix it?',
    options: ['The sides move, so the path difference changes', 'A delay only ever works with electric instruments', 'Polarity alone is the cause, not the timing'],
    correct: 'The sides move, so the path difference changes',
    explain: 'The moving sides change each mic’s distance to each side, so a fixed phase correction or a calculated delay cannot hold for the whole phrase. Move or rebalance if the sum hollows.',
    why: {
      'A delay only ever works with electric instruments': 'A delay works on any signal; it just cannot follow a moving source.',
      'Polarity alone is the cause, not the timing': 'Polarity flips the sign; the changing delay is what moves the notches.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'ac.prac.3',
    page: 'practice',
    prompt: 'What would justify a second accordion mic?',
    options: ['A side the first mic cannot balance', 'Two mics are the usual standard for it', 'More level than one mic can give the PA'],
    correct: 'A side the first mic cannot balance',
    explain: 'Add a bass-side mic only if its contribution matters — bass notes and chords may merit less pickup when a bass player is present. Check each feed alone and summed in mono.',
    why: {
      'Two mics are the usual standard for it': 'One integrated view is a fair start; a second has to earn its place.',
      'More level than one mic can give the PA': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'ac.mix.1',
    page: 'practice',
    prompt: 'The lowest bass notes thin out after you high-pass the bass mic. First check?',
    options: ['Bypass it; test the lowest notes, then reset', 'Raise the bass mic’s fader until the notes return', 'Swap to a mic with a bigger diaphragm'],
    correct: 'Bypass it; test the lowest notes, then reset',
    explain: 'A bass high-pass can clear rumble, but set it only after testing the instrument’s lowest required notes.',
    why: {
      'Raise the bass mic’s fader until the notes return': 'The filter is still removing them; more level raises the rest too.',
      'Swap to a mic with a bigger diaphragm': 'Check the filter you added first.',
    },
  },
  cardioidNull(MW),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'ac.s.treble',
    observation: 'The treble dominates',
    firstChecks: 'Is the mic close to the right-hand grille? Move back, or add or rebalance bass pickup if the part needs it.',
    options: ['Back off, or add or rebalance bass pickup', 'Cut the treble on the desk until it evens out', 'Ask the player to press the keys more softly'],
    correct: 'Back off, or add or rebalance bass pickup',
    explain: 'A close mic favours the nearest surface. Move back to combine the sides, or rebalance with a bass-side mic if the music needs the bass.',
    why: {
      'Cut the treble on the desk until it evens out': 'EQ cannot bring back a bass side the mic is not hearing.',
      'Ask the player to press the keys more softly': 'The playing is the music; move the mic first.',
    },
  },
  {
    id: 'ac.s.bass',
    observation: 'The bass level changes as the bellows open',
    firstChecks: 'Is a fixed stand mic losing the moving left side? Watch the full travel; move, widen the perspective or mount a bass-side mic.',
    options: ['Watch full travel; move, widen, or mount one', 'Compress the bass mic hard to even it out', 'Ask the player to keep the bellows still'],
    correct: 'Watch full travel; move, widen, or mount one',
    explain: 'The bass side moves toward and away from a fixed mic. Watch the full travel; a farther, wider view or a mount on the bass side follows it.',
    why: {
      'Compress the bass mic hard to even it out': 'Compression hides a moving source; position solves it.',
      'Ask the player to keep the bellows still': 'The bellows are how the instrument plays.',
    },
  },
  {
    id: 'ac.s.noise',
    observation: 'Harsh key or bellows noise',
    firstChecks: 'Is a close mic aimed at the mechanism or the air stream? Shift aim or distance; compare an external integrated view.',
    options: ['Shift aim or distance; compare a farther view', 'Gate the channel so the clicks and clacks are cut', 'Add a high-pass filter to remove it'],
    correct: 'Shift aim or distance; compare a farther view',
    explain: 'A close mic aimed at the keys or the bellows hears more mechanism. Change the aim or distance first.',
    why: {
      'Gate the channel so the clicks and clacks are cut': 'A gate cuts the music’s ends too; the noise is in the placement.',
      'Add a high-pass filter to remove it': 'Mechanism noise is not only low; move the mic first.',
    },
  },
  monoSymptom(W),
  {
    id: 'ac.s.feedback',
    observation: 'Stage feedback',
    firstChecks: 'Did the player move toward a monitor, or are too many channels open? Lower the level first; change the geometry, close unused channels and retest.',
    options: ['Lower the level; fix geometry; close unused mics', 'Turn the monitors up so the player plays softer', 'Add another mic nearer the bellows'],
    correct: 'Lower the level; fix geometry; close unused mics',
    explain: 'Lower the level at once, then change the geometry and close unused channels; raise levels gradually during a real passage.',
    why: {
      'Turn the monitors up so the player plays softer': 'More monitor level brings feedback closer.',
      'Add another mic nearer the bellows': 'Another open mic adds spill and feedback risk.',
    },
  },
  {
    id: 'ac.s.rumble',
    observation: 'Rumble, or thin bass',
    firstChecks: 'Does filtering remove required notes, or does the mic miss the bass outlet? Bypass the filter, verify the low phrase, then adjust position and filter carefully.',
    options: ['Bypass the filter; check the low phrase and the mic', 'Boost the low end on the desk until the bass returns', 'Point a mic right into the bellows’ moving gap'],
    correct: 'Bypass the filter; check the low phrase and the mic',
    explain: 'Find whether a filter or the mic’s position is losing the bass before reaching for EQ.',
    why: {
      'Boost the low end on the desk until the bass returns': 'If a filter is cutting it, a boost fights the filter; check first.',
      'Point a mic right into the bellows’ moving gap': 'The bellows are not the bass outlet; find the bass side’s outlet.',
    },
  },
  {
    id: 'ac.s.cable',
    observation: 'A cable catches the bellows',
    firstChecks: 'Is the routing or the slack inadequate? Stop playing and remove the strain; re-route with the player.',
    options: ['Stop; release it; re-route with the player', 'Tape the cable tighter and carry on playing', 'Hold the cable clear by hand for the rest'],
    correct: 'Stop; release it; re-route with the player',
    explain: 'A clip or cable that catches during the bellows stroke is an immediate stop: lower the channel, remove the strain, and re-route with enough slack for the full cycle.',
    why: {
      'Tape the cable tighter and carry on playing': 'A taut cable in the bellows’ path is the problem, not the cure.',
      'Hold the cable clear by hand for the rest': 'Stop and fix the routing; never work round a moving instrument.',
    },
  },
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, outside the bellows’ travel', role: 'required', feedback: 'Say why it is a good place to begin, and that it stays outside the whole travel.' };
const SIDES_REASON: SetupReason = { id: 'r.sides', label: 'It hears the side the music needs', role: 'optional', feedback: 'A fair reason: both sides radiate, and the music decides which matters.' };

const setupTasks: SetupTask[] = [
  {
    id: 'ac.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio recording: a solo piano accordion, melody and bass both important, in a good room. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 45 cm in front, centred between the sides', ok: true, power: 'phantom', feedback: 'The recommended integrated start; it needs the phantom this channel has.' },
      { id: 'b', label: 'A condenser about 30 cm from the keyboard side, plus one just beyond the fully open bass side', ok: true, power: 'phantom', feedback: 'Fair for separate control — check the pair in mono over full bellows strokes.' },
      { id: 'c', label: 'A mic pointed into the bellows’ gap', ok: false, power: 'phantom', feedback: 'The bellows are the air source, and the mic would sit in their travel.' },
      { id: 'd', label: 'A mic taped to the treble grille', ok: false, power: 'phantom', feedback: 'Never tape a grille: it can damage the instrument and smother its sound.' },
      { id: 'e', label: 'One close mic on the treble grille only', ok: false, power: 'phantom', feedback: 'It favours the melody and may lose the bass the brief asks for.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, SIDES_REASON, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point outside the bellows’ travel that hears the sides the music needs, with the power the mic needs.',
  },
  {
    id: 'ac.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: the accordionist walks while playing; wedges in front. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'The instrument’s own built-in mics, routed as the player asks', ok: true, power: 'none', feedback: 'A practical live choice that moves with the player — compare its tone and noise if you can.' },
      { id: 'b', label: 'A small dynamic on a stand about 45 cm in front, its null toward the wedge', ok: true, power: 'none', feedback: 'Fair if the player stays near it; check the bass side’s travel and the wedge.' },
      { id: 'c', label: 'A miniature condenser on a mount, on this input', ok: false, power: 'phantom', feedback: 'It needs phantom power, which this input does not have.' },
      { id: 'd', label: 'A stand mic just clear of the closed bellows', ok: false, power: 'none', feedback: 'The bass side would reach it on every pull.' },
      { id: 'e', label: 'An omni in front, all mics left open', ok: false, power: 'none', feedback: 'An omni and open mics invite spill and feedback on a loud stage.' },
    ],
    reasons: [{ id: 'r.move', label: 'It follows the player, or stays outside their movement', role: 'required', feedback: 'A walking player needs a mic that moves with them, or a stand well clear.' }, POWER_REASON, CLEAR_REASON, { id: 'r.null', label: 'The pattern’s rejection is aimed at the loudest monitor', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a mic that moves with the player or stays outside their movement, powered by what this input supplies.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves the air through the reeds?', options: ['The bellows', 'The player’s breath', 'A fan inside'], after: 'Now STEP through the reed (or PLAY ONCE), then try its shapes and the bellows’ cycle.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Off to one side of the rear'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: the bellows open fully. What happens to a fixed mic’s distance to the bass side?', options: ['It changes', 'It stays the same', 'Only the treble side moves'], after: 'Rest the mic in two zones, then switch BELLOWS and watch the bass side move.' },
  context: { prompt: 'The wedge sits downstage, behind the mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A treble mic and a bass mic. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic — and switch BELLOWS to see the bass side’s delay move.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'ac.q.1',
    covers: 'instrument',
    prompt: 'On a piano accordion, which hand plays the bass buttons?',
    options: ['The left, on the side that moves', 'The right, beside the keyboard', 'Either, depending on the song'],
    correct: 'The left, on the side that moves',
    explain: 'The right hand plays the treble keyboard; the left works the bass buttons and the bellows, so the bass side moves.',
    why: {
      'The right, beside the keyboard': 'The right hand is on the treble keyboard.',
      'Either, depending on the song': 'The layout fixes it: bass buttons on the left side.',
    },
  },
  {
    id: 'ac.q.2',
    covers: 'instrument',
    prompt: 'What is the bellows’ job?',
    options: ['It moves the air through the reeds', 'It makes the sound, like a drum', 'It holds the two sides apart'],
    correct: 'It moves the air through the reeds',
    explain: 'The bellows are the air source: pulling and pushing them draws air through the reeds.',
    why: {
      'It makes the sound, like a drum': 'The reeds make the sound; the bellows supply the air.',
      'It holds the two sides apart': 'It joins them and moves the air between them.',
    },
  },
  {
    id: 'ac.q.3',
    covers: 'sound',
    prompt: 'Why is an accordion hard to cover with one close mic?',
    options: ['Both sides radiate, and one of them moves', 'Its sound comes only from the folds of the bellows', 'It is too quiet for a mic that is far away'],
    correct: 'Both sides radiate, and one of them moves',
    explain: 'The treble grille and the bass end both sound, each with its own timbre, and the bass side moves with the bellows.',
    why: {
      'Its sound comes only from the folds of the bellows': 'The bellows are the air source; the reeds sound out through the two sides.',
      'It is too quiet for a mic that is far away': 'A farther mic often combines the sides better.',
    },
  },
  {
    id: 'ac.q.4',
    covers: 'sound',
    prompt: 'Push and pull on a piano accordion: what happens to a key’s note?',
    options: ['It stays the same both ways', 'It changes with the direction', 'It stops sounding on a push'],
    correct: 'It stays the same both ways',
    explain: 'A piano accordion keeps each key’s note in both directions; a diatonic button accordion changes it.',
    why: {
      'It changes with the direction': 'That is a diatonic button accordion.',
      'It stops sounding on a push': 'It sounds both ways — the reeds for each direction share the note.',
    },
  },
  {
    id: 'ac.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a stand near an accordionist, what comes before any distance?',
    options: ['Clear of the full bellows travel and the arms', 'The exact distance the starting point gives you', 'The shortest cable run to the stage box'],
    correct: 'Clear of the full bellows travel and the arms',
    explain: 'Watch a full passage at maximum extension; keep stands, legs and cables away from the hands, straps, elbows and the bellows’ whole travel.',
    why: {
      'The exact distance the starting point gives you': 'The numbers are starting points; the travel comes first.',
      'The shortest cable run to the stage box': 'A tidy cable matters, but never before the bellows and the arms.',
    },
  },
  quickHearing(W),
];

export const A11_LESSON: Lesson = {
  id: 'A11',
  labId: 'winds',
  title: 'Accordion',
  subtitle: 'Two moving sides: one mic in front, one for each side, or a mount that moves with it',
  noun: { one: 'accordion', many: 'accordions' },
  model: A11_MODEL,
  micTypeIds: ['sdcCard', 'smallDynCard', 'accMini'],
  zones: A11_ZONES,
  setupPairs: [{ label: 'A treble mic and a bass mic', A: { zone: 'ac.treble', typeId: 'sdcCard' }, B: { zone: 'ac.bass', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Watch a full passage with the player, the bellows at full stretch', early: 'Start with the player and the bellows’ travel.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A reed instrument worn on the chest: a treble side with a piano keyboard (or buttons) for the right hand, a bass side with buttons for the left, and the bellows between them that move the air through the reeds.', src: 'HOH-XS' },
    { title: 'WHERE YOU MEET IT', text: 'Solo, in folk and dance bands and in larger ensembles — on stage, where the player may walk and turn, and in the studio. (The full ensemble setup comes later, in Lab 5.)', src: 'LESSON-AC' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The treble side carries the melody; the bass side plays bass notes and chords — often both at once. With a bass player in the band, the bass side may matter less.', src: 'S-ACC' },
    { title: 'ITS SIZE', text: 'A full-size piano accordion has 41 treble keys and 120 or more bass buttons. This lab draws one about 48 cm (19 in) tall, its bellows opening up to about 60 cm (2 ft) at the bottom.', src: 'S-ACC' },
  ],
  sound: {
    stages: [
      { title: 'Air from the bellows', text: 'The left arm pulls or pushes the bellows: air flows through the reed blocks inside both sides, to the reeds whose keys and buttons are pressed.' },
      { title: 'Through the slot', text: 'The air pushes a reed through its slot. As it clears the plate, the way opens: a puff of air passes.' },
      { title: 'Springing back', text: 'The springy reed swings back through its slot — closing it as it passes — and on past it, and the way opens again.' },
      { title: 'Two sides sounding', text: 'Each reed keeps swinging at its own frequency, chopping the air into puffs: the notes. The treble reeds sound out through the grille, the bass reeds through the bass side — both sides radiate, and the bass side moves.' },
    ],
    attack: 'The note’s start: the reed swinging up to full size as the bellows’ pressure builds — plus the keys’ and buttons’ clicks and the bellows’ own noises. Close mics hear more of that mechanism.',
    body: 'The sustained sound from two places at once — the treble grille and the bass outlets, each with its own timbre — and one of them moves with every push and pull. A farther mic combines them; a close mic favours the nearer side. Tendencies — instruments, registers and players vary.',
    head: { diameterMm: 480, rods: 0, label: 'a full-size piano accordion', strikeSrc: 'S-ACC' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the accordion', short: 'PLAYER', note: 'Standing (or seated), the accordion on the chest, the bass side moving with the bellows. The hands, the straps, the elbows and the bellows’ whole travel come before any stand.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor in front, facing back at the player — behind a mic that faces the accordion, where a pattern’s null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'a side-fill monitor on the bass side', short: 'SIDE FILL', note: 'Off to the bass side: the bass side — and any mic on it — moves toward it on every pull. Evaluate that position separately.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MOVES CLOSER', scene: 'stage' },
      { id: 'band', label: 'the band', short: 'BAND', note: 'Loud neighbours: a closer directional mic or a mount helps more than gain; fewer open channels help most.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Listen first from the audience side, unamplified, for where the two sides combine.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'LISTEN FIRST', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet room that sounds good, one mic farther out can combine the two sides and the room.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: the fewest open channels that give the balance; loudspeakers out of each mic’s strongest pickup across the player’s whole movement; a mount or the built-in mics for a walking player; levels raised gradually.',
    studio: 'STUDIO: walk the room while the player plays, find where the two sides combine, start one mic there, then compare nearer the treble and farther integrated positions. Add a bass-side mic only if it matters.',
  },
  diagnostic,
  practice: {
    task: 'Keep every stand and cable outside the bellows’ travel, choose one integrated view or a mic per side on purpose, leave headroom for the loudest passage, and judge any pair in mono over full strokes. With the player’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'Accordion type (piano, chromatic or diatonic button), registers', kind: 'text' },
      { id: 'setup', label: 'Setup', kind: 'choice', choices: ['one mic in front', 'a mic per side', 'mounted or built-in mics'] },
      { id: 'mic', label: 'Mic(s) and pattern(s)', kind: 'text' },
      { id: 'zone', label: 'Distances and the side each favours', kind: 'text' },
      { id: 'clear', label: 'Clearance from the bellows’ full travel; cable slack', kind: 'text' },
      { id: 'notes', label: 'What you heard: balance, mechanism, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every size is a drawing default except the counts (41 keys, 120 buttons): the treble box 480 × 200 × 180 mm, the bass box 480 × 140 × 180 mm, the grille 300 × 80 mm with its centre 1150 mm above the floor.', dims: ['trebleH', 'trebleW', 'trebleD', 'bassH', 'bassW', 'bassD', 'grilleH', 'grilleW', 'grilleHt', 'yFloor'] },
    { text: 'The bellows: closed 100 mm, fully open 600 mm at the bottom and about 264 mm at the top (a 35° fan), half open 350 / 175 mm — drawing defaults; the bass outlets drawn at the bass side’s end, positions unknown.', dims: ['bellowsClosed', 'bellowsMax', 'fanMax', 'cableSlack'] },
    { text: 'The bellows-side starting point (about 4–6 in) is measured by the lab from the bass side at its full opening, so the stand stays outside the travel (CORRECTIONS_LOG AC-02); the bands round 12 in and 18 in are the lab’s.', dims: [] },
    { text: 'The frame is the proposal’s, mirrored to the engine’s convention (+z to the player’s right).', dims: [] },
  ],
  live: { wedges: A11_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. The distances come from listening tests and practice: one mic about 30–60 cm in front, a condenser about 30 cm from the keyboard side, one close to the bass side, a dynamic about 46 cm from the grille. Every accordion, register, player and room is different: move the mic, experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: one reed’s swing (motion drawn larger), an ideal reed’s shapes, a full-size piano accordion whose sizes are drawing defaults, mic patterns as textbook shapes. Distances are rounded to about 5 mm. Keep every stand and cable outside the bellows’ whole travel, and nothing goes on the instrument without the player’s agreement.',
  copy: { words: metalWords('accordion', 'player') },
};
