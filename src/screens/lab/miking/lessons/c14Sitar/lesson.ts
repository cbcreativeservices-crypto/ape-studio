/**
 * C14 SITAR — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Sitar-Miking-Technique.txt) with the research
 * fixes C14-01 … applied (CORRECTIONS_LOG.md): the hearing line added, the
 * two-mic arrangement and the close omni kept as one engineer's choices for
 * their rooms, the far view and the immersive session in words. The
 * sympathetic strings are shown with the ideal-string model (which shapes
 * line up), never as a level. Starting-points voice; FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupTask, Symptom } from '../../engine/model/types.ts';
import { ACCURACY, brandReason, clearReason, contextChecks, DOC_REASON, hearingCheck, hearingDiag, LOUD_REASON, micChecks, POWER_REASON, practiceChecks, setupOrder, sharedSymptoms, STRINGS_PREDICT, twoMicChecks } from '../shared/guitars/stringsContent.ts';
import { C14_MODEL, C14_WEDGES, C14_ZONES } from './geometry.ts';
import { C14_COPY, SITAR_N } from './copy.ts';
import { SITAR } from '../shared/lutes/luteSpec.ts';

const P = 'st';
const CLEAR = 'the mizrab hand, the left hand’s travel, the gourd and the player’s view';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the sitar',
    goal: 'Get to know the sitar — a long-necked, fretted lute on a gourd, with melody, drone and (often) sympathetic strings — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The mizrab plucks a main string over a broad bone bridge; the bridge drives the board on the gourd; and the sympathetic strings under the arched frets ring with the notes that match them.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a mizrab stroke becomes sound — the string grazing the broad bridge, the board, the gourd’s air — where the sound leaves, and why the sympathetic strings ring after some notes. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The board, driven through the broad bridge, does most of the work; the bridge’s buzz is the player’s; and the sympathetic strings answer only the notes that match their tuning.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a sitar player on the floor — the mizrab hand, the long neck, the bends, the gourd — the neighbours (tabla, tanpura), what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The space round the sitar is the player’s, low on the floor. Check what this sitar has before promising a sound. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the sitar by its properties — pattern, power, response and mount — not by its brand, and not by capsule size alone.',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the four checks (one reaches back to how the sitar sounds).' },
    takeaway: 'A focused cardioid gives detail and rejection; an omni suits a quiet room and a close spot; a ribbon is a choice for its smoothness — check its own rules. Compare at matched levels.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — low, toward the bridge and the body, about 18–20 cm out — measured from the point the starting point names, clear of the player, then move the mic and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named point. Low toward the bridge first; high toward the neck only if it adds something; farther back where the room is good.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and see why the tabla beside the sitar is a balance question, not a null.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Aim a rejection at the monitor by the mic’s actual pattern; keep the open mics few. The tabla beside the sitar is balanced, not nulled. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why the low and high mics on one sitar can hollow out the body when combined, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two paths hear the sitar at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. Judge the pair in mono at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — aim, distance, the instrument itself, the room, the signal paths, levels and polarity — before reaching for EQ. A rattle is the player’s to diagnose, never a miking fix.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one sitar mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second path.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real sitar.' },
    takeaway: 'Safe clearance from a player on the floor, correct power and level checks, honest labels for a pickup, pattern reasoning and polarity versus delay pass. A brand or a capsule size do not.',
  },
};

const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'Where does most of a sitar’s sound leave from?',
    options: ['The board on the gourd, driven through the main bridge', 'The long neck, which vibrates along the whole of its length', 'The row of small pegs along the side of the neck'],
    correct: 'The board on the gourd, driven through the main bridge',
    explain: 'The strings move little air. They rock the broad bridge, the bridge drives the thin board (the tabli) over the gourd, and the board radiates most of the sound.',
    why: {
      'The long neck, which vibrates along the whole of its length': 'The neck carries the strings; the board over the gourd does most of the radiating.',
      'The row of small pegs along the side of the neck': 'The pegs hold the sympathetic strings; they make little sound of their own.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'A sympathetic string is never plucked. When does it ring?',
    options: ['When a played note lines up with one of its own shapes', 'Whenever a string is played, whatever note it happens to be', 'Only when the player strikes it with the back of the mizrab'],
    correct: 'When a played note lines up with one of its own shapes',
    explain: 'The bridge passes it the played string’s motion. It builds up only where one of its shapes sits at the same pitch as one of the played note’s — so it rings after some notes and stays quiet after others.',
    why: {
      'Whenever a string is played, whatever note it happens to be': 'Pushed out of step with itself, it barely moves. The note has to line up with its tuning.',
      'Only when the player strikes it with the back of the mizrab': 'Sympathetic strings ring by sympathy — that is the name — not by being struck.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'A close mic hears a bright buzz from the main bridge. What is it, most likely?',
    options: ['The strings grazing the bridge’s broad top, as intended', 'A fault in the mic, which a different mic model would then cure', 'A loose fret, which the engineer should tighten now'],
    correct: 'The strings grazing the bridge’s broad top, as intended',
    explain: 'The sitar’s broad, gently curved bridge lets each string graze it as it swings: the buzzing brightness is part of the instrument. Ask the player what is intended; a close mic just hears more of it.',
    why: {
      'A fault in the mic, which a different mic model would then cure': 'The buzz is in the instrument. A mic close to the bridge hears more of it.',
      'A loose fret, which the engineer should tighten now': 'The bridge’s buzz is intended, and the instrument is the player’s to adjust — never a mic step.',
    },
  },
  hearingCheck(P, SITAR_N),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'The producer wants “that sympathetic shimmer” on the record. What do you check first?',
    options: ['That this sitar has sympathetic strings, and the passage excites them', 'Which mic brand gives the most shimmer on a sitar', 'Nothing: each sitar shimmers if the mic is placed close enough'],
    correct: 'That this sitar has sympathetic strings, and the passage excites them',
    explain: 'Sitars differ: one has thirteen sympathetic strings, another has none. Confirm what this one has, and that the music plays notes that line up with their tuning, before promising a sound.',
    why: {
      'Which mic brand gives the most shimmer on a sitar': 'A brand cannot add strings that are not there. Check the instrument.',
      'Nothing: each sitar shimmers if the mic is placed close enough': 'Some sitars have no sympathetic strings at all — and a matched note is still needed.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'Before you place a stand mic for a sitar player on the floor, what do you need from them?',
    options: ['Their whole motion: the mizrab, the bends, the neck, the gourd', 'The make of the sitar, so you can look up its single correct spot', 'Nothing yet: a starting point already says where the mic goes'],
    correct: 'Their whole motion: the mizrab, the bends, the neck, the gourd',
    explain: 'A starting point is valid only where the player cannot hit the mic. Watch the widest neck and hand movement — the bends pull strings far across the frets — and keep clear of the gourd on the foot.',
    why: {
      'The make of the sitar, so you can look up its single correct spot': 'No make sets a mic position. The player’s motion and the sound wanted do.',
      'Nothing yet: a starting point already says where the mic goes': 'A starting point says where to begin — and only where the player stays clear.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic aimed high, toward the neck, hears more of what?',
    options: ['String character, any sympathetic shimmer, and fret noise', 'The gourd’s air and the deepest part of the body', 'The bridge’s buzz, heard close up and at its very brightest'],
    correct: 'String character, any sympathetic shimmer, and fret noise',
    explain: 'Toward the neck, a mic hears more of the strings, the sympathetic strings under the frets (if there are any) and the left hand — and less of the board over the gourd.',
    why: {
      'The gourd’s air and the deepest part of the body': 'That is low, toward the bridge and the body.',
      'The bridge’s buzz, heard close up and at its very brightest': 'The bridge is at the other end, on the board. Close to it, the buzz grows.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'Does a small-diaphragm mic lack the sitar’s low end because it is small?',
    options: ['Not by itself: check its response and listen at matched levels', 'Yes: a small diaphragm cannot hear the lower notes well', 'Yes, unless a ribbon is used, which cures a harsh source'],
    correct: 'Not by itself: check its response and listen at matched levels',
    explain: 'Diaphragm size alone does not decide the low end, and no mic type cures a harsh source by itself. Read the response, then compare at similar levels.',
    why: {
      'Yes: a small diaphragm cannot hear the lower notes well': 'Size alone does not decide low-frequency response. Check the published response, and listen.',
      'Yes, unless a ribbon is used, which cures a harsh source': 'A ribbon is a choice for its sound, not a cure. Compare by ear.',
    },
  },
  {
    id: `${P}.mic.3`,
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mics can you use?',
    options: ['The instrument dynamic: it needs no power at all', 'The small condenser, if its cable run is kept short', 'Either one, as long as the gain is turned up high'],
    correct: 'The instrument dynamic: it needs no power at all',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power, whatever its cable or the gain setting.',
    why: {
      'The small condenser, if its cable run is kept short': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
      'Either one, as long as the gain is turned up high': 'Gain cannot power a condenser. It needs phantom power to work at all.',
    },
  },
  ...micChecks(P, SITAR_N).filter((s) => s.id === `${P}.mic.4`),
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'A starting point says about 18–20 cm from the board, toward the bridge and the body. Your readout says 19 cm out from the neck. Are you in it?',
    options: ['Not necessarily: it is read toward the bridge, not the neck', 'Yes: 19 cm falls inside the 18 to 20 cm band', 'Yes, as long as the mic is pointed at some part of the sitar'],
    correct: 'Not necessarily: it is read toward the bridge, not the neck',
    explain: 'A distance means something only with its place. Low toward the bridge and high toward the neck are two different starting points at the same distance.',
    why: {
      'Yes: 19 cm falls inside the 18 to 20 cm band': 'Same number, different place. This band is low, toward the bridge and the body.',
      'Yes, as long as the mic is pointed at some part of the sitar': 'Aim is a separate check, and this zone names where on the sitar to begin.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'With a low and a high mic both offered, why begin with the low one alone?',
    options: ['Most of the sound is in front of the bridge; add the high one only if needed', 'The high mic is the louder one, so it should be faded in last', 'Two mics on a sitar cancel out, so one is the only real choice'],
    correct: 'Most of the sound is in front of the bridge; add the high one only if needed',
    explain: 'Low toward the bridge and body carries most of the sitar. The high mic adds string character and shimmer — keep it only when that contribution is clear and the pair holds up in mono.',
    why: {
      'The high mic is the louder one, so it should be faded in last': 'Level is set by gain and faders. The reason is what each mic contributes.',
      'Two mics on a sitar cancel out, so one is the only real choice': 'A pair can work; it combs only at some pitches. Add it for a purpose and check in mono.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'One engineer used a close omni about 20 cm below the bridge in a noisy hall. What does that tell you?',
    options: ['A choice for that room: getting close; not a rule for every room', 'The best sitar position, to be copied in whatever room you use', 'That omnis are the only mics that work on a sitar'],
    correct: 'A choice for that room: getting close; not a rule for every room',
    explain: 'Close placement raised the sitar above the hall’s noise in that session. In a quiet, good room a farther view may represent the instrument better. Compare in your own room.',
    why: {
      'The best sitar position, to be copied in whatever room you use': 'It was a choice for that hall. The close and far approaches differ by room and goal — examples, not a ranking.',
      'That omnis are the only mics that work on a sitar': 'Cardioids, omnis and ribbons all appear in sitar sessions; each is a choice for its room.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a sitar player on the floor?',
    options: ['The mizrab hand, the neck’s travel, the gourd and their view', 'The front of the gourd, so that the audience can see the inlay', 'The rug at the front, which belongs to the floor wedge'],
    correct: 'The mizrab hand, the neck’s travel, the gourd and their view',
    explain: 'Clearance comes first: the mizrab hand over the board, the left hand pulling strings far across the frets, the gourd resting on the foot, and the player’s view. Stop the player before anything moves.',
    why: {
      'The front of the gourd, so that the audience can see the inlay': 'In front of the board is usually where the mic goes. The space to protect is the player’s.',
      'The rug at the front, which belongs to the floor wedge': 'Stands and cables need a route, but the safety question is the player’s hands, the neck and the gourd.',
    },
  },
  ...contextChecks(P, SITAR_N),
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A quiet studio with a good room. What is a fair first step for the sitar?',
    options: ['Build it on one mic, then compare a farther view or a pair', 'Put up five mics at once to capture each of the possible layers', 'Start from the far room mic and add close mics to fix it'],
    correct: 'Build it on one mic, then compare a farther view or a pair',
    explain: 'One clear mic first; then, if the room supports the music, compare a farther view or a pair against it — judging the quiet opening and the decay as well as the strong strokes.',
    why: {
      'Put up five mics at once to capture each of the possible layers': 'Many layers at once hide what each adds. A multi-mic session is one production’s choice, built step by step.',
      'Start from the far room mic and add close mics to fix it': 'Get a clear main sound first; a room layer belongs where the room sounds good.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · Live, you bring the low mic closer to the bridge for more level. What grows with it?',
    options: ['The nearest attack and the bridge’s buzz', 'The sympathetic strings’ shimmer, most of all', 'The gourd’s air and the room, more than the strings'],
    correct: 'The nearest attack and the bridge’s buzz',
    explain: 'Close to the bridge, the nearest attack and the jawari’s buzz dominate. More level before feedback comes with more local colour — retain only the buzz the player intends.',
    why: {
      'The sympathetic strings’ shimmer, most of all': 'The shimmer is heard more toward the neck and with distance, not right at the bridge.',
      'The gourd’s air and the room, more than the strings': 'Closer means more direct, nearer sound — less room, not more.',
    },
  },
  ...twoMicChecks(P, SITAR_N),
  ...practiceChecks(P, SITAR_N, {
    quote: '18–20 cm, low, toward the bridge and the body',
    right: 'The board, low, aimed in at the bridge and the body',
    wrong1: 'The neck, high up, where the sympathetic strings are',
    wrong2: 'The back of the gourd, measured through the sitar',
    explain: 'A distance belongs to the place it names: low toward the bridge and high toward the neck are different starting points for the same number.',
  }),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.weak`,
    observation: 'Weak body, a small tone',
    firstChecks: 'Is the mic only on one small spot? Compare a broader view of the lower board, or a little more distance — and ask whether the sitar itself is quiet.',
    options: ['Take in more of the lower board, or move back a little', 'Boost the low end hard on the sitar’s own channel strip', 'Move the mic right against the gourd for more body'],
    correct: 'Take in more of the lower board, or move back a little',
    explain: 'A view of one small spot misses the board. Take in more of it, or back off a little — and listen to the sitar unamplified to know what it gives.',
    why: {
      'Boost the low end hard on the sitar’s own channel strip': 'EQ cannot add a body the position misses. Move first.',
      'Move the mic right against the gourd for more body': 'Nothing rests on the gourd: it is fragile, and a mic there rattles and damps it.',
    },
  },
  {
    id: `${P}.sym.buzz`,
    observation: 'Too much bridge attack or buzz',
    firstChecks: 'Is the mic aimed right at the bridge, very close? Aim off it or move back — keeping the jawari character the player intends.',
    options: ['Aim off the bridge or move back, keeping the intended buzz', 'Ask the player to adjust the bridge so it buzzes less', 'Cut the high frequencies hard until the buzz is gone'],
    correct: 'Aim off the bridge or move back, keeping the intended buzz',
    explain: 'Close on the bridge, its buzz dominates. Change the aim or distance; the buzz itself is part of the instrument, set by the player.',
    why: {
      'Ask the player to adjust the bridge so it buzzes less': 'The bridge is the player’s instrument and sound. Never ask for it to be changed for a mic.',
      'Cut the high frequencies hard until the buzz is gone': 'EQ dulls the whole sitar. Fix the position first.',
    },
  },
  {
    id: `${P}.sym.symp`,
    observation: 'The sympathetic decay disappears',
    firstChecks: 'Does this sitar have sympathetic strings, and does the passage excite them? Then test a wider view and the room.',
    options: ['Check it has them and the notes match; then try a wider view', 'Turn up the high frequencies until the shimmer comes back', 'Move the mic right under the frets, against the strings'],
    correct: 'Check it has them and the notes match; then try a wider view',
    explain: 'No sympathetic strings — or notes that do not line up with their tuning — means no shimmer to catch. If they are there, a wider view and the room carry the decay.',
    why: {
      'Turn up the high frequencies until the shimmer comes back': 'EQ cannot add a shimmer that is not being made. Check the instrument and the notes first.',
      'Move the mic right under the frets, against the strings': 'That is inside the left hand’s path and touches the instrument. Keep the clearance.',
    },
  },
  {
    id: `${P}.sym.rattle`,
    observation: 'Unwanted rattles',
    firstChecks: 'Listen to the sitar acoustically first; ask the player or a technician to diagnose the instrument. Never adjust the bridge or hardware as a miking fix.',
    options: ['Listen acoustically, then ask the player to diagnose it', 'Tighten whatever looks loose on the sitar yourself', 'Gate the channel so that the rattle is cut between the notes'],
    correct: 'Listen acoustically, then ask the player to diagnose it',
    explain: 'A rattle in the instrument is the player’s or a technician’s to find. Confirm it is the sitar (not a stand or a cable), then ask.',
    why: {
      'Tighten whatever looks loose on the sitar yourself': 'Never adjust the instrument for a mic. The player or a technician does that.',
      'Gate the channel so that the rattle is cut between the notes': 'A gate cuts the decays too, and the rattle stays under the notes.',
    },
  },
  ...sharedSymptoms(P, SITAR_N),
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · A concert stage: the sitar on a rug, the tabla beside, a floor wedge in front. One channel for the sitar; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, low toward the bridge and body, about 18–20 cm, rear to the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point, close enough to stand out from the tabla, aimed against the wedge.' },
      { id: 'b', label: 'Instrument dynamic low toward the bridge, angled in, rear to the wedge', ok: true, power: 'none', feedback: 'A recommended starting point; a robust stage choice. Watch the proximity bass and the buzz.' },
      { id: 'c', label: 'Small condenser 25–45 cm from the lower board, across the bridge, rear to the wedge', ok: true, power: 'phantom', feedback: 'A recommended start a little farther back: softer, more of the whole sitar — check the tabla spill.' },
      { id: 'd', label: 'Small condenser clamped to the gourd, facing the board', ok: false, power: 'phantom', feedback: 'Nothing is clamped to a fragile gourd without the owner’s consent and an approved mount — and it rattles.' },
      { id: 'e', label: 'Small omni 1 m in front, to hear the whole sitar naturally', ok: false, power: 'phantom', feedback: 'On a stage beside the tabla, an omni that far out hears the tabla and the wedge as much as the sitar.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.tabla', label: 'Closer placement helps the sitar stand out from the tabla beside it', role: 'optional', feedback: 'A fair live reason: the balance between the two matters.' }, brandReason(SITAR_N), { id: 'r.big', label: 'A small capsule will lose the sitar’s low end, so it must be large', role: 'wrong', feedback: 'Capsule size alone does not decide the low end. Check the response and listen.' }],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named place, clearance from the player, power that matches the mic.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, solo sitar with sympathetic strings. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic low toward the bridge and body, about 18–20 cm', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom. Listen for the decay.' },
      { id: 'b', label: 'Instrument dynamic 25–45 cm from the lower board, across the bridge', ok: true, power: 'none', feedback: 'A recommended start a little farther back; it needs no phantom.' },
      { id: 'c', label: 'Small condenser low toward the bridge, cardioid', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Small condenser with its omni capsule below the bridge', ok: false, power: 'phantom', feedback: 'A recommended spot in a quiet room — but a condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic resting on the board beside the bridge', ok: false, power: 'none', feedback: 'Never rest a mic on the instrument: it damps the board and can mark it.' },
    ],
    reasons: [DOC_REASON, clearReason(CLEAR), POWER_REASON, { id: 'r.decay', label: 'I will judge the sympathetic decay as well as the strong strokes', role: 'optional', feedback: 'A fair studio reason: the decay is part of the sitar.' }, brandReason(SITAR_N), LOUD_REASON],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what this input can supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when a sitar string is plucked?', options: ['The string itself', 'The board, driven by the bridge', 'The sympathetic strings'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  placement: { prompt: 'Predict: you move the mic from low by the bridge to high by the neck. What changes?', options: ['More body', 'More string character and shimmer', 'It depends on this sitar'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  ...STRINGS_PREDICT,
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What are a sitar’s sympathetic strings?',
    options: ['Strings under the frets that ring when matching notes are played', 'Extra melody strings that the player plucks for the high notes', 'Strings that tie the frets onto the neck so they cannot slide'],
    correct: 'Strings under the frets that ring when matching notes are played',
    explain: 'They run under the arched frets to small pegs along the neck, and are never plucked: they ring in sympathy with notes that match their tuning. Some sitars have none.',
    why: {
      'Extra melody strings that the player plucks for the high notes': 'The melody strings run over the frets and are plucked; the sympathetic ones are not.',
      'Strings that tie the frets onto the neck so they cannot slide': 'The frets are tied on with cord; the sympathetic strings are strings in their own right.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Why are a sitar’s frets arched high over the neck?',
    options: ['The sympathetic strings pass under them, the main strings over', 'They make the neck stronger, so it carries the strings’ pull', 'They hold the gourd in place against the bottom of the neck'],
    correct: 'The sympathetic strings pass under them, the main strings over',
    explain: 'The arch leaves room beneath for the sympathetic strings; the main strings cross the tops, and the player pulls them sideways across the frets to bend notes.',
    why: {
      'They make the neck stronger, so it carries the strings’ pull': 'The neck carries the pull; the arches make room under the frets.',
      'They hold the gourd in place against the bottom of the neck': 'The gourd is joined at the neck’s foot; the frets are on the neck itself.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'After some notes the sitar keeps a shimmer; after others it does not. Why?',
    options: ['Only notes that line up with the sympathetic tuning set them ringing', 'The player damps the sympathetic strings with a hand on the gourd', 'Higher notes ring on longer than the lower notes on a sitar'],
    correct: 'Only notes that line up with the sympathetic tuning set them ringing',
    explain: 'A sympathetic string builds up only where one of its own shapes matches one of the played note’s. Matched notes shimmer on; others leave it nearly still.',
    why: {
      'The player damps the sympathetic strings with a hand on the gourd': 'The difference comes from the notes and the tuning, not from damping.',
      'Higher notes ring on longer than the lower notes on a sitar': 'Pitch height is not the reason; whether the note lines up with the tuning is.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The sitar has a bright, buzzing edge from its main bridge. Whose is it?',
    options: ['The player’s: set in the instrument, part of the sound', 'The engineer’s: added by the mic, so it can be removed', 'The room’s: a reflection that appears only on stage'],
    correct: 'The player’s: set in the instrument, part of the sound',
    explain: 'The strings graze the broad bridge’s curved top — the jawari sound, set by the player. A close mic hears more of it; aim and distance balance it, the bridge is never touched.',
    why: {
      'The engineer’s: added by the mic, so it can be removed': 'The buzz is made by the instrument. The mic only hears more or less of it.',
      'The room’s: a reflection that appears only on stage': 'The buzz is at the bridge, in any room. Listen acoustically to confirm.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a sitar player on the floor?',
    options: ['The mizrab hand, the neck’s travel, the gourd and their view', 'The front of the gourd, so the audience can see it clearly', 'The space behind the player, where the tanpura sits'],
    correct: 'The mizrab hand, the neck’s travel, the gourd and their view',
    explain: 'The mizrab works over the board, the left hand pulls strings far across a long neck, the gourd rests on the foot, and the player watches. In front of the board is usually where a mic comes in.',
    why: {
      'The front of the gourd, so the audience can see it clearly': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the player, where the tanpura sits': 'The tanpura’s place matters, but the moving space is the sitar player’s hands, neck and gourd.',
    },
  },
  hearingDiag(SITAR_N),
];

export const C14_LESSON: Lesson = {
  id: 'C14',
  labId: 'strings',
  title: 'Sitar',
  subtitle: 'Low by the bridge, high by the neck — and the sympathetic strings',
  noun: { one: 'sitar', many: 'sitars' },
  model: C14_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: C14_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(P, SITAR_N, 'Have the player stop; place it low toward the bridge; check the mizrab hand, the neck’s travel and the sight line')],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A plucked, fretted lute: a large gourd with a thin wooden board (the tabli), a broad bone bridge, and a long hollow neck with arched frets. Many sitars carry melody strings, drone strings and sympathetic strings — this one seven main and thirteen sympathetic; another sitar may have none.', src: 'MET-ADHIKARI' },
    { title: 'WHERE YOU MEET IT', text: 'North Indian classical music, usually with tabla and a tanpura drone, and in film, fusion and many other styles — on concert stages and in studios. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody, with bends pulled sideways across the frets, rhythmic drone strokes, and a shimmering decay from the sympathetic strings. The bridge’s buzzing brightness is part of it: ask what is intended.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a sitar the size of one real sitar: about 125 cm long, its gourd about 34 cm across and 31 cm deep. Where things sit on it — the frets, the pegs, the second gourd — are drawn, not measured. Sitars vary.', src: 'MET-ADHIKARI' },
  ],
  sound: {
    stages: [
      { title: 'The mizrab plucks', text: 'A wire plectrum worn on the index finger — the mizrab — strikes a main string over the board, near where the neck begins. That is where the ATTACK starts.' },
      { title: 'The string swings — grazing the bridge', text: 'Released, the string swings between its still ends — the broad main bridge and the nut, or the fret it is pressed to. As it swings it grazes the bridge’s gently curved top: the bright, buzzing edge the player intends. Motion drawn many times larger.' },
      { title: 'The bridge drives the board', text: 'Each swing works the broad bridge, and the bridge drives the thin board over the gourd. The board moves the air — the air inside the gourd too.' },
      { title: 'Sound leaves', text: 'Sound leaves mostly from the board round the bridge, toward a listener in front. The strings and the left hand are heard most directly toward the neck.' },
      { title: 'The sympathetic strings answer', text: 'Under the frets, sympathetic strings tuned for the music are set going by the bridge when the played note lines up with their tuning — and ring on after it. On a sitar that has them; the next steps show why only some notes do it.' },
    ],
    attack: 'The start of the note: the mizrab’s strike and the string grazing the broad bridge — a bright, buzzing onset. It is heard most directly close to the bridge; a close mic there makes it dominate.',
    body: 'The note’s ring: the strings, the board and the gourd’s air together, plus — after matching notes — the sympathetic shimmer. A wider view and the room carry the decay; toward the neck, more shimmer and string. Tendencies; sitars vary.',
    head: { diameterMm: 290, rods: 0, label: 'the board', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the sitar', short: 'PLAYER', note: 'Seated on the floor, the gourd on the left foot, the neck rising to the left past the shoulder. The mizrab hand, the left hand’s long travel and bends, the gourd and the player’s view are theirs.', prov: { kind: 'illustrative', reason: 'the proposal’s floor posture' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'rug', label: 'the rug or riser', short: 'RUG', note: 'The performers sit on a rug, often on a low riser. Stand bases and cables stay off it where the players sit and move, and clear of the way on and off.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'FLOOR SPACE', scene: 'all' },
      { id: 'tabla', label: 'the tabla', short: 'TABLA', note: 'Beside the sitar: loud, bright and close. It reaches the sitar mic from the side — distance and balance do more than a null; the tabla has its own mics.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'tanpura', label: 'the tanpura (the drone)', short: 'TANPURA', note: 'Behind, sustaining the drone. Quiet but continuous: the sitar mic hears some of it, and it belongs in the blend.', prov: { kind: 'illustrative', reason: 'a typical concert layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front, facing back at the player. A mic aimed at the board has it behind and below — aim a rejection at it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. Its sound fills the stage and can ring through the sitar’s body into a close mic.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge. The level the room needs decides how close a mic must be.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, good room the sitar’s bloom and decay can be part of the sound — a farther view or a pair can carry them.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front, the tabla beside, the PA facing out. Keep the open mics few; bring sends up gradually and pull them down at the first ring.',
    studio: 'STUDIO: no wedges, repeated trials when the player stops, and a room that can carry the decay.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given sitar, player and room, describe an alternative position, and explain what would justify a second mic. With a real sitar and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'sitar', label: 'Sitar (sympathetic strings? a second gourd?)', kind: 'text' },
      { id: 'mic', label: 'Mic type and pattern', kind: 'choice', choices: ['small condenser', 'dynamic', 'ribbon', 'other'] },
      { id: 'paths', label: 'Other paths (a pickup)', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'notes', label: 'What you heard: attack, buzz, decay (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The overall 124.5 × 34.3 × 31 cm is one museum sitar’s; the gourd’s centre, the board’s size, the neck (85 wide, 60 deep), the nut at 88 cm (the proposal’s neck end at +1080 overran the sourced length), the frets (19, a diatonic run), the bridges, the pegs and the upper gourd (Ø 20 cm, moved to +860 inside the sourced length) are drawing defaults.', dims: [] },
    { text: 'The posture — on the floor, the gourd on the left foot, the neck at about 45° — and the foot under the gourd (7 cm): the proposal’s drawing default; no geometry source. No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The keep-off margins (board 8 mm, strings 10 mm, bridge 6 mm, gourd 10 mm): illustrative.', dims: ['sitar'] },
    { text: 'The “about 20 cm” and “about 7–8 in” bands are drawn ± 3 cm and ± 2.5 cm; the 25–45 cm start is the lesson’s own teaching trial.', dims: [] },
    { text: 'The tabla, tanpura, wedge and PA positions — a typical layout.', dims: [] },
  ],
  live: { wedges: C14_WEDGES },
  accuracyDetail: ACCURACY(SITAR_N, `one real sitar (${SITAR.sympathetic.mm} sympathetic strings — some sitars have none)`),
  copy: C14_COPY,
};
