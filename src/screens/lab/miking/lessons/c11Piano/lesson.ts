/**
 * C11 PIANO (grand, baby grand, upright) — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/Acoustic-Piano-Miking-Technique.txt, cited "L<n>" in COMMENTS
 * only) with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (C11-01
 * … C11-08, C11-D1, C11-G1 … G4) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * The research stays in docs/labs/miking/acoustic_piano/ and the code-only
 * fields. Pinned by test/mikingLearnerText.test.ts and
 * test/mikingLab4Keys.test.ts.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { micRatingCheck } from '../../engine/model/sharedItems.ts';
import { FLOOR_Y } from '../shared/piano/pianoSpec.ts';
import { PIANO_MODEL } from './geometry.ts';
import { GB, PIANO_ZONES } from './model.ts';
import { PIANO_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the piano',
    goal: 'Get to know the piano — grand, baby grand and upright: what it is, where you meet it, what it does in the music, and its parts, from the hammers to the lid — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Keys throw felt hammers at the strings; the soundboard under (or behind) them moves the air; a grand’s lid and an upright’s panels shape where it goes. The lid, the panels and the inside are the owner’s.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a key becomes sound — the hammer, the strings, the bridge, the soundboard, the damper — and where the sound leaves the piano. Shown, never played.',
    credit: { scenarios: ['pn.snd.1', 'pn.snd.2', 'pn.snd.3'], interactive: 'soundPath', note: 'Step the key through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The attack starts where the hammers strike the strings; the body comes from the soundboard, which radiates up and down. A grand’s raised lid throws much of it out over the curved side; an upright sends much of it out at the back.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the piano’s surroundings — the pianist’s hands, feet and sight line, the lid and who sets it, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['pn.set.1', 'pn.set.2', 'pn.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The pianist’s hands sweep the whole keyboard, their feet work the pedals, and they read the music desk: keep stands and cables out of all three. The lid goes on its stick first, by someone who knows the piano. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the piano by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['pn.mic.1', 'pn.mic.2', 'pn.mic.3', 'pn.mic.4', 'pn.rec.1'], note: 'Answer the five checks (one reaches back to how the piano sounds).' },
    takeaway: 'Condensers are common on piano for its wide range; a capable dynamic can suit a loud stage. Omnis take in the instrument and the room; directional mics separate it. Keep headroom: very loud peaks happen close to the hammers.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — over the strings, back from the hammers, outside the curve, over the open top or behind the soundboard — measured from the surface each names, clear of everything that moves, then move the mic and see what changes.',
    credit: { scenarios: ['pn.place.1', 'pn.place.2', 'pn.place.3', 'pn.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named surface — not a rule. Height, distance from the hammers and angle are separate things to try, and the lid, the strings and the pianist’s space come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'With the lid on the short stick, aim the mic so its pattern’s rejection faces a side-fill speaker — and know what the lid, the case and a pattern can and cannot do.',
    credit: { scenarios: ['pn.ctx.1', 'pn.ctx.2', 'pn.ctx.studio', 'pn.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the side-fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A lower lid and a closer, directional mic separate a piano from a loud stage; the case itself shields a mic inside it. A pattern’s null is shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Bass and treble',
    goal: 'See why a mic over the bass and one over the treble can thin out in mono, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['pn.two.1', 'pn.two.2', 'pn.two.3', 'pn.two.4', 'pn.two.5'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the five checks.' },
    takeaway: 'Two spaced mics hear the middle strings at different times: in mono that can comb. Moving a mic changes the delay; the polarity switch does not. Check each mic alone, the pair, and the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the lid, the mic’s distance from the hammers, the pair’s geometry, the monitors, the stands — and the piano itself, before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one piano mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['pn.prac.order', 'pn.prac.gain', 'pn.prac.setup1', 'pn.prac.setup2', 'pn.prac.3', 'pn.mix.1', 'pn.mix.2', 'pn.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real piano.' },
    takeaway: 'A safely set lid, clearance from everything that moves, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “widest” stereo picture do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Every item tests reasoning; every wrong option is a real
 * misconception of about the same length, with its own explanation. Lesson
 * lines in comments only: pn.snd.* L6 · pn.set.* L7, L40, L70 · pn.mic.* L39-L40
 * · pn.place.* L30-L31, L37 · pn.ctx.* L33-L35 · pn.two.* L28, L32 ·
 * pn.prac.* / pn.mix.* L28, L71-L76.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'pn.snd.1',
    page: 'sound',
    prompt: 'A key is pressed and held. What stops the note when the key comes back up?',
    options: ['The hammer presses the strings to stop them', 'The damper falls back onto the strings', 'The soundboard stops when the key is released'],
    correct: 'The damper falls back onto the strings',
    explain: 'Pressing the key lifts that note’s damper; releasing it lets the felt fall back on the strings and stop them — unless the sustain pedal holds every damper up.',
    why: {
      'The hammer presses the strings to stop them': 'The hammer strikes and falls straight back: it never rests on the strings. The damper stops them.',
      'The soundboard stops when the key is released': 'The board vibrates only while the strings drive it. The damper stops the strings, and the board follows.',
    },
  },
  {
    id: 'pn.snd.2',
    page: 'sound',
    prompt: 'Where does most of the sound of a piano come from — the strings themselves, or something else?',
    options: ['The strings alone, since they are the part that vibrates', 'The soundboard, driven by the strings through the bridge', 'The lid, which vibrates hardest when the piano is played'],
    correct: 'The soundboard, driven by the strings through the bridge',
    explain: 'A string is too thin to move much air on its own. The bridge passes its vibration to the large, light soundboard, and the board moves the air.',
    why: {
      'The strings alone, since they are the part that vibrates': 'They vibrate, but they are too thin to move much air. The soundboard does that.',
      'The lid, which vibrates hardest when the piano is played': 'The lid mainly reflects and shapes the sound; the soundboard makes most of it.',
    },
  },
  {
    id: 'pn.snd.3',
    page: 'sound',
    prompt: 'A grand’s lid is up on the full stick. Where is much of the sound thrown?',
    options: ['Back toward the pianist, over the music desk', 'Out over the curved side, where the lid opens', 'Straight down, into the floor under the piano'],
    correct: 'Out over the curved side, where the lid opens',
    explain: 'The soundboard radiates up and down; the raised lid reflects much of the upward sound out over the open, curved side — usually toward the audience. Some also leaves under the piano.',
    why: {
      'Back toward the pianist, over the music desk': 'The lid is hinged on the bass side and opens on the curved side; it throws sound that way, not back over the keys.',
      'Straight down, into the floor under the piano': 'Some sound leaves under the piano, but the raised lid sends much of the upward sound out over the curved side.',
    },
  },
  {
    id: 'pn.set.1',
    page: 'setting',
    prompt: 'You want a mic over the strings of a grand whose lid is closed. Who raises the lid, and when?',
    options: ['You raise it a little yourself, and hold it while the mic goes in', 'Nobody: slide the mic in under the closed lid instead', 'Someone who knows the piano, onto its stick, before any stand'],
    correct: 'Someone who knows the piano, onto its stick, before any stand',
    explain: 'The lid goes onto its designed full- or short-stick position, set by someone familiar with the instrument, before stands or mounts are adjusted. Never reach under a lid that is not safely propped.',
    why: {
      'You raise it a little yourself, and hold it while the mic goes in': 'Never put hands under an unsecured lid. It goes onto its stick first, by someone who knows the piano.',
      'Nobody: slide the mic in under the closed lid instead': 'A mic pushed under a closed lid can touch the strings or dampers, or be crushed. Ask, and set the lid first.',
    },
  },
  micRatingCheck({ id: 'pn.set.2', page: 'setting', mic: 'piano mic', loudest: 'the loudest chord' }),
  {
    id: 'pn.set.3',
    page: 'setting',
    prompt: 'Where should a mic stand’s base and cable NOT go around a grand?',
    options: ['Out beyond the curved side, well clear of the case and the lid', 'By the pedals, the bench and the pianist’s feet', 'Near the tail, behind the end of the piano'],
    correct: 'By the pedals, the bench and the pianist’s feet',
    explain: 'The pianist’s feet work the pedals and their body moves on the bench; a stand or cable there can be kicked or thump. Route stands and cables away from the pedals, the bench and the performer.',
    why: {
      'Out beyond the curved side, well clear of the case and the lid': 'That is where many stands go: the boom reaches in under the lid from the open side.',
      'Near the tail, behind the end of the piano': 'Clear of the pianist, it can be a fair spot for a stand, though farther from the strings.',
    },
  },
  {
    id: 'pn.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the hammer line, over the strings, tends to hear more of what?',
    options: ['The room and the hall’s reflections', 'The bass under the soundboard', 'The hammers’ attack and the mechanism'],
    correct: 'The hammers’ attack and the mechanism',
    explain: 'The attack starts where the hammers strike the strings, with the action’s own noises. Close to the hammers tends to bring more of it; farther away, a softer attack.',
    why: {
      'The room and the hall’s reflections': 'Close to the strings the mic hears mostly the piano; the room comes in with distance.',
      'The bass under the soundboard': 'The board radiates underneath too, but a mic up by the hammers hears their attack most.',
    },
  },
  {
    id: 'pn.mic.1',
    page: 'microphone',
    prompt: 'A solo piano in a good room. Why might a pair of omnis outside the curve suit it?',
    options: ['They reject the room, so the piano sounds much closer and drier', 'They need no stands, so nothing goes near the piano', 'They take in the whole instrument and the room together'],
    correct: 'They take in the whole instrument and the room together',
    explain: 'Omnis do not reject by direction: just outside the piano they blend the whole keyboard with the room — good in a room worth hearing, poor beside drums or loud monitors.',
    why: {
      'They reject the room, so the piano sounds much closer and drier': 'Omnis take in the room; they do not reject it. That is why they suit a good room.',
      'They need no stands, so nothing goes near the piano': 'They stand on stands, outside the curve. The reason is the blend, not the mount.',
    },
  },
  {
    id: 'pn.mic.2',
    page: 'microphone',
    prompt: 'A loud stage, the piano beside the drums. What tends to help the piano mics most?',
    options: ['Omnis far outside, to take in the whole stage', 'Directional mics close in, with the lid lowered', 'More gain on distant mics until the piano is loud'],
    correct: 'Directional mics close in, with the lid lowered',
    explain: 'Close, directional mics and a shorter or closed lid separate the piano from the stage and help gain before feedback — at the cost of a closer, more percussive sound.',
    why: {
      'Omnis far outside, to take in the whole stage': 'Far omnis take in the drums and the monitors too. Close and directional separates better.',
      'More gain on distant mics until the piano is loud': 'More gain raises the spill and the feedback risk with it. Get the mic closer first.',
    },
  },
  {
    id: 'pn.mic.3',
    page: 'microphone',
    prompt: 'Where does a supercardioid reject the most?',
    options: ['Straight behind it, right on its rear axis', 'Off to each side of the rear, near 125°', 'At its sides, square to its front'],
    correct: 'Off to each side of the rear, near 125°',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection is toward the rear but off the axis. Aim the source you want less of into that region.',
    why: {
      'Straight behind it, right on its rear axis': 'That is a cardioid. A supercardioid picks up a little straight behind.',
      'At its sides, square to its front': 'At 90° a supercardioid still picks up a fair amount; its deepest rejection is farther round, near 125°.',
    },
  },
  {
    id: 'pn.mic.4',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mic types can you use on the piano?',
    options: ['The small condenser, if it is close', 'The dynamic: it needs no power', 'Either one, with a shorter cable'],
    correct: 'The dynamic: it needs no power',
    explain: 'A dynamic needs no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it is close': 'How close it is does not change what it needs: a condenser needs phantom power.',
      'Either one, with a shorter cable': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
    },
  },
  {
    id: 'pn.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 30 cm above the middle strings”. Your readout says 30 cm above the RIM. Are you in it?',
    options: ['Yes: 30 cm is 30 cm, whichever part you measure from', 'Yes, as long as the mic is right over the middle of the keyboard', 'Not quite: the rim stands above the strings — measure from them'],
    correct: 'Not quite: the rim stands above the strings — measure from them',
    explain: 'A distance means something only with its surface. A grand’s strings sit well below the rim, so 30 cm above the rim is more than 30 cm above the strings — which is why every readout names what it measures from.',
    why: {
      'Yes: 30 cm is 30 cm, whichever part you measure from': 'Same number, different surface. The band is measured from the strings, below the rim.',
      'Yes, as long as the mic is right over the middle of the keyboard': 'Where across the keyboard it sits is a separate check. The height is read from the strings.',
    },
  },
  {
    id: 'pn.place.2',
    page: 'placement',
    prompt: 'You move the mic from about 20 cm to about 45 cm back from the hammer line. What tends to change?',
    options: ['More attack and more mechanism, since the hammers are farther away', 'Nothing: only the height above the strings matters', 'A softer attack, with less of the hammers and mechanism'],
    correct: 'A softer attack, with less of the hammers and mechanism',
    explain: 'Nearer the hammers tends to bring more attack and mechanism; moving back along the strings tends to soften it. Compare at matched levels; pianos vary.',
    why: {
      'More attack and more mechanism, since the hammers are farther away': 'The reverse: the attack starts at the hammers, so moving away tends to soften it.',
      'Nothing: only the height above the strings matters': 'Height and distance from the hammers are separate variables; both change the sound.',
    },
  },
  {
    id: 'pn.place.3',
    page: 'placement',
    prompt: 'Why does a stand’s boom usually reach over a grand’s strings from the curved side?',
    options: ['That side is where the strings are strongest and loudest', 'The starting points are all measured from the curved side of the case', 'That side is open under the raised lid, away from the pianist'],
    correct: 'That side is open under the raised lid, away from the pianist',
    explain: 'The lid is hinged on the straight bass side and opens on the curved side: that is where there is room under it, clear of the pianist’s hands, sight line and feet.',
    why: {
      'That side is where the strings are strongest and loudest': 'The reason is room and clearance, not loudness: the lid opens on that side.',
      'The starting points are all measured from the curved side of the case': 'Most are measured from the strings or the hammer line; the boom’s side is about clearance.',
    },
  },
  {
    id: 'pn.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Before any stand goes near a grand, what has to happen to the lid?',
    options: ['It is lifted by hand and held while the stand goes in', 'It is closed, so the mics can rest on top of it', 'It is set on its stick by someone who knows the piano'],
    correct: 'It is set on its stick by someone who knows the piano',
    explain: 'The lid goes onto its designed stick position first; then stands and mounts. Mics come out before the lid is lowered again.',
    why: {
      'It is lifted by hand and held while the stand goes in': 'Never work under a lid that is held up by hand. It goes onto its stick first.',
      'It is closed, so the mics can rest on top of it': 'A mic on a closed lid hears the lid, not the strings — and it can scratch the finish.',
    },
  },
  {
    id: 'pn.ctx.1',
    page: 'context',
    prompt: 'A piano mic under the short-stick lid is picking up a loud side-fill speaker. What is a good first move to try?',
    options: ['Turn the piano channel up until it covers the side-fill', 'Turn the mic so the side-fill falls in its rejection', 'Raise the lid to full stick to let the piano out'],
    correct: 'Turn the mic so the side-fill falls in its rejection',
    explain: 'Aim the pattern’s rejection at the speaker, by its actual pattern, while the mic still faces the strings. Lowering the speaker’s level or moving it are the next checks — and reduce the level before moving anything.',
    why: {
      'Turn the piano channel up until it covers the side-fill': 'More gain raises the side-fill in that channel too, and the feedback risk. Aim the rejection first.',
      'Raise the lid to full stick to let the piano out': 'A higher lid opens the mic to the stage as well. On a loud stage a lower lid usually separates better.',
    },
  },
  {
    id: 'pn.ctx.2',
    page: 'context',
    prompt: 'The piano mic is inside the case, under the lid. A floor wedge sits well below the rim. What does the case do?',
    options: ['Nothing: the mic hears the wedge exactly as it would in open air', 'It shields the mic from much of the wedge’s direct sound', 'It makes the wedge louder in the mic, like a horn'],
    correct: 'It shields the mic from much of the wedge’s direct sound',
    explain: 'The rim and the lid stand in the straight path from a floor wedge to a mic inside the case. The free-field pattern ignores that, so the lab says “shielded” instead of printing a number — real reflections still reach the mic.',
    why: {
      'Nothing: the mic hears the wedge exactly as it would in open air': 'The case is in the way of the direct path. The pattern picture ignores it, which is why no number is shown.',
      'It makes the wedge louder in the mic, like a horn': 'The rim blocks the direct path rather than focusing it. Reflections still arrive, more weakly.',
    },
  },
  {
    id: 'pn.ctx.studio',
    page: 'context',
    prompt: 'Studio session, a beautiful room, a solo pianist. What could justify mics outside the piano instead of over the strings?',
    options: ['Outside mics pick up far less of the hammers than they really do', 'The room is worth hearing, and the music wants the whole instrument', 'Mics over the strings belong on a stage, not in a studio'],
    correct: 'The room is worth hearing, and the music wants the whole instrument',
    explain: 'In a good room, an outside pair blends the whole keyboard with the room — a natural solo perspective. Over the strings brings definition; the choice is what the music needs.',
    why: {
      'Outside mics pick up far less of the hammers than they really do': 'Outside mics hear the hammers too, blended with the rest. The reason is the room and the whole instrument.',
      'Mics over the strings belong on a stage, not in a studio': 'Mics over the strings are common in studios. The decision is the perspective the music wants.',
    },
  },
  {
    id: 'pn.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · An upright stands against a wall. Where does much of its sound leave?',
    options: ['Out of the front, through the keys toward the pianist', 'Out of the back, from its soundboard, toward the wall', 'Only up through the open top, nowhere else'],
    correct: 'Out of the back, from its soundboard, toward the wall',
    explain: 'An upright’s soundboard is at the back. Much of its sound leaves there, toward the wall, and some up through the top — so the wall behind changes what a mic hears.',
    why: {
      'Out of the front, through the keys toward the pianist': 'The front has the action and panels in the way. The soundboard faces the back.',
      'Only up through the open top, nowhere else': 'Some leaves through the top, but the soundboard faces the back: much leaves there.',
    },
  },
  {
    id: 'pn.two.1',
    page: 'twoMic',
    prompt: 'One mic over the bass strings, one over the treble. Why can the pair sound hollow in mono?',
    options: ['The bass mic hears its strings in reverse polarity', 'Two mics on one piano cancel each other completely in mono', 'The middle strings reach the two mics at different times'],
    correct: 'The middle strings reach the two mics at different times',
    explain: 'Sound from the middle of the keyboard has a different path to each mic. Summed in mono, the delayed copy cancels at some frequencies — a comb — which can hollow the middle out.',
    why: {
      'The bass mic hears its strings in reverse polarity': 'Both mics face the same side of the soundboard here, so neither starts out inverted: the issue is arrival TIME. (A mic under the board is different — see the next check.)',
      'Two mics on one piano cancel each other completely in mono': 'They comb at some frequencies and add at others; how much depends on the delay and the levels.',
    },
  },
  {
    id: 'pn.two.2',
    page: 'twoMic',
    prompt: 'You flip the bass mic’s polarity. What happens to the arrival-time difference?',
    options: ['It drops to zero, so the two arrivals line up again in time', 'Nothing: polarity flips the sign; the delay stays the same', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals line up again in time': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'pn.two.3',
    page: 'twoMic',
    prompt: 'The bass/treble pair sounds thin in mono. Which change works on the cause itself?',
    options: ['Pan the two mics harder left and right to widen them', 'Boost the middle frequencies on both mics until it sounds full again', 'Bring the pair closer or change its geometry, then recheck'],
    correct: 'Bring the pair closer or change its geometry, then recheck',
    explain: 'The cause is the time difference between the mics. Narrowing the pair, changing its geometry — a coincident pair, or one mic — changes it. Panning and EQ do not.',
    why: {
      'Pan the two mics harder left and right to widen them': 'Panning changes the stereo picture, not the mono sum. The comb is still there in mono.',
      'Boost the middle frequencies on both mics until it sounds full again': 'EQ cannot undo a comb between mics; it boosts the peaks with the dips.',
    },
  },
  {
    id: 'pn.two.4',
    page: 'twoMic',
    prompt: 'Does a piano need two mics?',
    options: ['Yes: one mic cannot hear a piano’s whole range at all', 'Yes, whenever the piano is a concert grand rather than an upright', 'Only if the second solves a real bass, treble or image problem'],
    correct: 'Only if the second solves a real bass, treble or image problem',
    explain: 'Begin with one mic when channels, space or a mono PA call for simplicity: find a balanced view across the keyboard, and add a second only when it solves a real problem.',
    why: {
      'Yes: one mic cannot hear a piano’s whole range at all': 'One well-placed mic can give a usable full-range picture, especially for mono reinforcement.',
      'Yes, whenever the piano is a concert grand rather than an upright': 'The piano’s type does not decide it. What the second mic solves does.',
    },
  },
  {
    id: 'pn.two.5',
    page: 'twoMic',
    prompt: 'A mic under the grand’s soundboard and one over the strings sound thin together. What do you try first?',
    options: ['Boost the low end on the under mic until the blend sounds full', 'Move the under mic farther away so it is quieter in the blend', 'Each alone, then mono, then this mic’s polarity both ways'],
    correct: 'Each alone, then mono, then this mic’s polarity both ways',
    explain: 'The board pushes air up as it pulls air down, so the two start out roughly opposite in the lows. Compare both polarity states in mono at matched levels; the delay between them is still there.',
    why: {
      'Boost the low end on the under mic until the blend sounds full': 'EQ cannot undo a cancellation between mics; it boosts what is left of it. Check the polarity first.',
      'Move the under mic farther away so it is quieter in the blend': 'Quieter hides the thinning a little; the two still start out opposite. Compare both polarity states.',
    },
  },
  {
    id: 'pn.prac.gain',
    page: 'practice',
    prompt: 'Soft passages sit well below the overload light, but fortissimo chords light it. What do you do?',
    options: ['Pull the channel fader down until the chords sound clean', 'Lower the input gain, or use a pad its manual allows, and re-check', 'Ask the pianist to play the loud chords more softly during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Keep gain headroom for fortissimo transients: very loud peaks happen close to the hammers. A lowered fader does not undo clipping at the input; use a pad only as the manual permits.',
    why: {
      'Pull the channel fader down until the chords sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the pianist to play the loud chords more softly during the show': 'Set gain for the playing the music needs — fortissimo included — not for a gentle soundcheck.',
    },
  },
  {
    id: 'pn.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second piano mic?',
    options: ['One mic misses a register, and the pair holds up in mono', 'Two channels give the mix engineer more options later on', 'The piano needs more level than one mic can give it'],
    correct: 'One mic misses a register, and the pair holds up in mono',
    explain: 'A second mic should solve a real bass, treble or image problem — and the pair should still sound full in mono. Otherwise one well-placed mic may be stronger.',
    why: {
      'Two channels give the mix engineer more options later on': 'More channels also add spill, cables and a combining check. A second mic should earn its place.',
      'The piano needs more level than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'pn.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 20 cm behind the soundboard” on an upright. Where do you measure from?',
    options: ['The wall behind the piano, since it is easier to reach with a stand', 'The front of the keys, where the pianist sits', 'The back of the soundboard, not the wall or the case front'],
    correct: 'The back of the soundboard, not the wall or the case front',
    explain: 'A distance belongs to the surface it names: “behind the soundboard” is from the board at the back of the piano.',
    why: {
      'The wall behind the piano, since it is easier to reach with a stand': 'Easier to reach, but not what this starting point names. Measure from the soundboard.',
      'The front of the keys, where the pianist sits': 'That is the other side of the piano. The named surface is the soundboard at the back.',
    },
  },
  {
    id: 'pn.mix.2',
    page: 'practice',
    prompt: 'A side-fill sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Silence from the side-fill, because it sits in the null', 'Strong rejection on paper; in reality less, and least in the lows', 'More side-fill than straight behind the mic, where it rejects most'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the side-fill, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
      'More side-fill than straight behind the mic, where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'pn.mix.3',
    page: 'practice',
    prompt: 'A spaced pair over a piano sounds thin in mono. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning one mic up until it matches the other'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning one mic up until it matches the other': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'pn.sym.hammer',
    observation: 'Too much hammer or key noise',
    firstChecks: 'Check how close the mic is to the hammers and the action; move it away or choose an outer or rear perspective.',
    options: ['How close it is to the hammers, then move it back or out', 'Cut the high frequencies until the noise goes away', 'Turn the piano channel down and the reverb up'],
    correct: 'How close it is to the hammers, then move it back or out',
    explain: 'Close to the hammers and the action brings their attack and noise. Move away along the strings, higher, or to an outside or rear view — then judge.',
    why: {
      'Cut the high frequencies until the noise goes away': 'EQ dulls the whole piano with the noise. Change the position first.',
      'Turn the piano channel down and the reverb up': 'That hides the piano, not the noise. The mic’s position is the cause.',
    },
  },
  {
    id: 'pn.sym.mono',
    observation: 'The pair sounds hollow when summed to mono',
    firstChecks: 'Compare each mic alone and the pair in mono; narrow the pair or change its geometry.',
    options: ['Each mic alone, then the pair in mono; narrow or change the pair', 'Flip one mic’s polarity and leave it that way for good', 'Boost the low middle frequencies on both of the mics until it is full'],
    correct: 'Each mic alone, then the pair in mono; narrow or change the pair',
    explain: 'Spaced mics hear the strings at different times; in mono that combs. Move the mics, narrow the spacing, or use a coincident pair or one mic.',
    why: {
      'Flip one mic’s polarity and leave it that way for good': 'Polarity does not remove a delay. It may move the problem; check both states, then fix the geometry.',
      'Boost the low middle frequencies on both of the mics until it is full': 'EQ cannot undo a comb between mics. Change the geometry.',
    },
  },
  {
    id: 'pn.sym.wide',
    observation: 'The piano sounds unnaturally wide',
    firstChecks: 'The bass/treble pair panned too far: reduce the pan width and judge in the full mix.',
    options: ['The pan width of the bass/treble pair, judged in the mix', 'Move both mics farther apart over the strings to fill the middle', 'Add a third mic in the middle to fill the gap'],
    correct: 'The pan width of the bass/treble pair, judged in the mix',
    explain: 'A stereo piano does not need to span hard left and right in a full-band mix. Narrow the pan and judge it with the band.',
    why: {
      'Move both mics farther apart over the strings to fill the middle': 'Wider spacing tends to widen the image further — and adds delay between them.',
      'Add a third mic in the middle to fill the gap': 'Another mic adds another delay and more spill. Narrow the pan first.',
    },
  },
  {
    id: 'pn.sym.spill',
    observation: 'Excessive stage spill in the piano mics',
    firstChecks: 'An open lid or a distant, wide-pattern mic: get closer, use a shorter or closed lid, revise the monitor positions.',
    options: ['The lid, the distance and the pattern, then the monitors', 'Turn the piano mics up until the piano covers the spill on stage', 'Add an omni mic outside to capture a cleaner piano'],
    correct: 'The lid, the distance and the pattern, then the monitors',
    explain: 'Closer, directional mics and a shorter or closed lid separate the piano; moving the monitors helps too. Reduce the level before moving anything.',
    why: {
      'Turn the piano mics up until the piano covers the spill on stage': 'More gain raises the spill with the piano, and the feedback risk.',
      'Add an omni mic outside to capture a cleaner piano': 'An omni outside the piano hears more of the stage, not less.',
    },
  },
  {
    id: 'pn.sym.rattle',
    observation: 'Feedback, or a lid rattle at show level',
    firstChecks: 'Monitor, lid/mount or hardware contact: reduce the level, secure or relocate safely, and retest.',
    options: ['Reduce the level, then secure or move the mount and retest', 'Keep playing and fix it with EQ during the next song', 'Wedge something between the lid and the rim to stop it buzzing'],
    correct: 'Reduce the level, then secure or move the mount and retest',
    explain: 'Bring the level down first. Then find what touches what — a mount, a cable, the lid — and secure or relocate it safely, with the owner’s agreement. Never improvise on the lid’s hardware.',
    why: {
      'Keep playing and fix it with EQ during the next song': 'Feedback and rattles need the level down now, then a physical fix.',
      'Wedge something between the lid and the rim to stop it buzzing': 'Never alter the lid’s support or hardware. Ask the owner; fix the mount.',
    },
  },
  {
    id: 'pn.sym.pedal',
    observation: 'Pedal thumps in the mics',
    firstChecks: 'A lower-front upright position or floor coupling: reposition, isolate the stand, and have the mechanism inspected.',
    options: ['The mic position and the stand’s contact with the floor', 'Cut the low frequencies until the thumps are gone', 'Ask the pianist not to use the pedals during the show'],
    correct: 'The mic position and the stand’s contact with the floor',
    explain: 'Pedal thumps reach a mic near the lower front, or through the floor into a stand. Reposition, isolate the stand, and let a technician inspect a noisy pedal.',
    why: {
      'Cut the low frequencies until the thumps are gone': 'A filter can help a little, but it also thins the piano. Find the path first.',
      'Ask the pianist not to use the pedals during the show': 'The pedals are part of the music. Fix the path the thumps take.',
    },
  },
];

/** The one-mic setup (L71-L75), with power and gain rules. */
const orderTasks: OrderTask[] = [
  {
    id: 'pn.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic piano setup in the order you would do them.',
    steps: [
      { text: 'Ask the pianist and the owner: the piece, the lid, what may go inside', early: 'Start with the pianist, the owner and the music.' },
      { text: 'Have the lid set on its stick (or the panel taken off) by them', early: 'The lid comes once you know what the owner allows — and before any stand.' },
      { text: 'Choose a mic whose specs suit, and a secure stand or an approved mount', early: 'Choose the mic once the lid is set and you know the space you have.' },
      { text: 'Place it, clear of the strings, dampers, lid and the pianist', early: 'You need a chosen mic, and a set lid, before you place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on soft playing AND fortissimo chords, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels and in mono', early: 'Compare only once the level is set safely — at matched levels.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: headroom for the loudest chords — very loud peaks happen near the hammers.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right surface', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from — the strings, the curve, the top.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of the strings, dampers, lid and the pianist', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on a piano', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const WIDE_REASON: SetupReason = { id: 'r.wide', label: 'It will give the widest stereo piano possible', role: 'wrong', feedback: 'Width is not a passing reason — a piano need not span hard left and right, and wide pairs can thin out in mono.' };

/** The final task (L75): several setups pass; the reasons are graded. */
const setupTasks: SetupTask[] = [
  {
    id: 'pn.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club stage, a grand beside the drums, wedges everywhere. One or two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'Lid on the short stick; one dynamic about 15 cm over the middle strings, 20 cm back from the hammers', ok: true, power: 'none', feedback: 'A recommended starting point under a lower lid: close, separated, and the dynamic needs no power.' },
      { id: 'b', label: 'Lid on the short stick; a small condenser aimed into a sound hole in the frame', ok: true, power: 'phantom', feedback: 'A recommended one-mic live option, separated by the lower lid — the condenser has its phantom power here.' },
      { id: 'c', label: 'Short stick; a treble mic and a bass mic over the strings, checked in mono', ok: true, power: 'phantom', feedback: 'Recommended starting points for a split pair, separated by the lid — and the mono check is in the plan.' },
      { id: 'd', label: 'Lid on the full stick; a pair of omnis two metres out in the room', ok: false, power: 'phantom', feedback: 'Omnis far out hear the drums and the wedges more than the piano: a poor choice beside a loud stage.' },
      { id: 'e', label: 'A dynamic resting on the strings near the hammers, for the most attack', ok: false, power: 'none', feedback: 'Nothing may touch the strings, dampers or hammers. Keep the mic above them.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.lid', label: 'The lower lid helps separate the piano from the stage', role: 'optional', feedback: 'A fair live reason — at the cost of a closer, more percussive sound.' }, BRAND_REASON, WIDE_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named surface, clearance from everything that moves, and power that matches the mic.',
  },
  {
    id: 'pn.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A quiet room, an upright pulled out from the wall, a singer-songwriter. One channel, and it has NO phantom power.',
    setups: [
      { id: 'a', label: 'A dynamic just over the open top, between bass and treble, checked across the keyboard', ok: true, power: 'none', feedback: 'A recommended starting point over the top; a dynamic needs no phantom.' },
      { id: 'b', label: 'A dynamic about 20 cm behind the soundboard, moved to find the sweet spot', ok: true, power: 'none', feedback: 'A recommended rear starting point — with time to listen for the sweet spot; no phantom needed.' },
      { id: 'c', label: 'A small condenser inside the open top, aimed toward the hammers', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'A dynamic squeezed between the piano’s back and the wall', ok: false, power: 'none', feedback: 'Pressed against the wall there is no usable space: pull the piano out (its owner moves it) or choose the top.' },
      { id: 'e', label: 'The upper front panel taken off by you, a dynamic at the hammers', ok: false, power: 'none', feedback: 'Panel removal is the owner’s or a technician’s job, never an operator default.' },
    ],
    reasons: [DOC_REASON, { ...CLEAR_REASON, label: 'The mic, stand and cable stay clear of the action, the pianist’s hands, feet and the pedals' }, POWER_REASON, { id: 'r.mono', label: 'One mic keeps a mono PA simple — no comb between two mics', role: 'optional', feedback: 'A fair reason when one balanced position works across the keyboard.' }, BRAND_REASON, { id: 'r.wall', label: 'Push the piano back to the wall so it sounds bigger', role: 'wrong', feedback: 'Pressed against the wall there is no room for a rear mic, and the wall changes the sound unpredictably.' }],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the action and the pianist, powered by what this input can supply.',
  },
];

/** One ungraded prediction before each rack activity (try before tell). */
const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what stops a piano note when the key comes up?', options: ['The hammer presses the string', 'A damper falls onto the strings', 'The soundboard stops by itself'], after: 'Now STEP through the key (or PLAY ONCE) and watch the hammer and the damper.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a mic back along the strings, away from the hammers. What changes?', options: ['More attack', 'A softer attack', 'It depends on this piano'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this mic, looking down into the piano, reject a side-fill speaker best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK (LESSON_JOURNEY §2.5): two items per foundation page; q.6
 * (hearing) is critical. It opens the activities; it credits nothing. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On a grand, which side is the lid hinged on?',
    options: ['The straight (bass) side; it opens on the curved side', 'The curved side; it opens toward the straight side', 'The keyboard end; it opens away from the pianist'],
    correct: 'The straight (bass) side; it opens on the curved side',
    explain: 'The lid hinges along the long straight bass side and is propped open on the curved treble side — the side that usually faces the audience.',
    why: {
      'The curved side; it opens toward the straight side': 'The reverse: it hinges on the straight side and opens over the curve.',
      'The keyboard end; it opens away from the pianist': 'The main lid hinges along the side, not across the keyboard end.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where is an upright piano’s soundboard?',
    options: ['At the back, behind the strings', 'At the front, behind the upper panel', 'Under the keys, by the pedals'],
    correct: 'At the back, behind the strings',
    explain: 'An upright’s strings stand upright with the soundboard behind them, at the back of the case — which is why the wall behind matters.',
    why: {
      'At the front, behind the upper panel': 'Behind the upper panel is the action — the hammers and dampers. The board is at the back.',
      'Under the keys, by the pedals': 'The lower front hides the lower strings and the pedal works; the board is at the back.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What moves most of the air when a piano note sounds?',
    options: ['The soundboard, driven through the bridge', 'The strings, since they are what vibrates', 'The hammers, as they bounce off the strings'],
    correct: 'The soundboard, driven through the bridge',
    explain: 'The strings are too thin to move much air; the bridge passes their vibration to the large soundboard, which does.',
    why: {
      'The strings, since they are what vibrates': 'They vibrate, but they move little air themselves. The soundboard does that.',
      'The hammers, as they bounce off the strings': 'The hammers start the sound and fall back; the soundboard radiates it.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A string vibrates in several shapes at once. How do their pitches compare on an ideal string?',
    options: ['Whole-number multiples of the lowest: 2, 3, 4 times', 'Uneven ratios, like a drumhead’s 1.59 and 2.14 times', 'All the same pitch, only the loudness differs'],
    correct: 'Whole-number multiples of the lowest: 2, 3, 4 times',
    explain: 'On an ideal string, shape n sounds n times the lowest — whole numbers, which is why a string sounds clearly pitched. (A real piano string is stiff, so its upper shapes run slightly sharp.)',
    why: {
      'Uneven ratios, like a drumhead’s 1.59 and 2.14 times': 'Those are a drumhead’s. A string’s shapes are whole-number multiples.',
      'All the same pitch, only the loudness differs': 'Each shape has its own pitch: n times the lowest on an ideal string.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Before any stand goes near a grand, what has to happen?',
    options: ['The lid is set on its stick by someone who knows the piano', 'The lid is held up by hand while you place the stand', 'The lid is closed so nothing can fall inside the piano'],
    correct: 'The lid is set on its stick by someone who knows the piano',
    explain: 'The lid goes onto its designed stick position first; never put hands under an unsecured lid, and take mics out before it is lowered.',
    why: {
      'The lid is held up by hand while you place the stand': 'Never work under a lid held by hand. It goes on its stick first.',
      'The lid is closed so nothing can fall inside the piano': 'Closed, it shuts the mic out of the strings. Set it on its stick, then place mics.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your piano mic is rated to a very high maximum SPL. What does that tell you about standing by the open piano through a long, loud soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the piano stays below the mic’s rated level', 'It is safe as long as the mic is nearer the hammers than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts; close to the hammers a piano can pass 130 dB. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for as long as the piano stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the hammers than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

/* ── the stage, in frame K (ILLUSTRATIVE: a typical layout) ── */
const wedges: Wedge[] = [
  {
    id: 'fill.side',
    label: 'a side-fill speaker on a stand, beside the piano’s curved side',
    short: 'SIDE-FILL',
    p: { x: 600, y: FLOOR_Y, z: 2200 },
    lift: 1500,
    faces: { x: 0, y: 0, z: -1 },
    note: 'A side-fill on a stand, beside the stage, at about head height: it can reach a mic under the lid through the gap between the rim and the lid — the case a pattern’s rejection can help with.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
    glyph: 'none',
  },
  {
    id: 'wedge.pianist',
    label: 'the pianist’s own wedge, on the floor by the bench',
    short: 'PIANO WEDGE',
    p: { x: -700, y: FLOOR_Y, z: -1100 },
    lift: 150,
    faces: { x: 0.2, y: 0, z: 1 },
    note: 'On the floor by the pianist, below the rim: the case stands between it and a mic inside, so no pattern number is shown — the rim shields the direct path.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout' },
  },
  {
    id: 'wedge.vocal',
    label: 'a singer’s wedge, downstage, facing upstage',
    short: 'VOCAL WEDGE',
    p: { x: 1500, y: FLOOR_Y, z: 1600 },
    lift: 150,
    faces: { x: -0.6, y: 0, z: -0.8 },
    note: 'Out by the singer, on the floor: below the rim, so a mic inside the case is largely shielded from it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout' },
  },
];

export const C11_LESSON: Lesson = {
  id: 'C11',
  labId: 'strings',
  title: 'Piano',
  subtitle: 'Grand, baby grand and upright: lid, strings and soundboard',
  noun: { one: 'piano', many: 'pianos' },
  model: PIANO_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: PIANO_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A keyboard instrument with struck strings: each key throws a felt hammer at its strings, and a soundboard turns their vibration into sound. A grand lies flat with a lid that opens; an upright stands its strings on end. 88 keys, from the lowest note, about 27.5 Hz, to the highest, about 4.19 kHz — with harmonics and attacks well above that.', src: 'DPA-PIANO' },
    { title: 'WHERE YOU MEET IT', text: 'Solo recitals and recording studios, bands and pits, churches, schools and clubs — a concert grand on a stage, a baby grand in a lounge, an upright against a wall. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody, harmony and rhythm at once, over the widest range of any common instrument: soft playing to fortissimo chords, staccato to sustained notes held by the pedal. Ask for the actual piece — low, middle and high passages — before choosing a mic.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'Grands run from about 1.5 m long (a baby grand) to about 2.7 m (a concert grand), all about 1.5 m wide; uprights about 1.3 m tall and 1.5 m wide. This lab draws a 2.1 m grand, a 1.55 m baby grand and a 1.32 m upright.', src: 'SW-B' },
  ],
  sound: {
    stages: [
      { title: 'The key goes down', text: 'The key is a lever. Pressing it throws the hammer up toward its strings — and lifts that note’s damper off them, so they can ring.', byVariant: { upright: 'The key is a lever. Pressing it swings the hammer forward toward its strings — and pulls that note’s damper off them.', uprightFront: 'The key is a lever. Pressing it swings the hammer forward toward its strings — and pulls that note’s damper off them.' } },
      { title: 'The hammer strikes', text: 'The felt hammer strikes the strings and falls straight back — it is thrown, not pushed, so it never rests on them. That brief contact is where the ATTACK begins.' },
      { title: 'The strings drive the soundboard', text: 'The strings vibrate (drawn here many times larger than they really move). They press on the bridge, and the bridge passes the vibration to the soundboard.' },
      { title: 'The soundboard moves the air', text: 'The large, light soundboard moves the air — upward toward the lid and down under the piano. This is the BODY of the sound: strings, board and case ringing together.', byVariant: { upright: 'The large, light soundboard at the back moves the air — much of it out of the back, toward the wall, and some up through the open top. This is the BODY of the sound.', uprightFront: 'The large, light soundboard at the back moves the air — much of it out of the back, toward the wall, and some up through the top. This is the BODY of the sound.' } },
      { title: 'The key comes up', text: 'Releasing the key lets the damper fall back onto the strings, and the note stops. The sustain pedal lifts every damper at once, so notes keep ringing until it is released.' },
    ],
    attack: 'The start of the sound: the hammer’s brief contact with the strings, with the key, the action and the dampers adding their own small noises. It begins at the hammer line, so a mic near the hammers tends to hear more of it — and of the mechanism.',
    body: 'The ring: the strings, the bridges, the soundboard and the case ringing together, leaving from the whole soundboard — up toward the lid and down under a grand, out of the back of an upright. A mic farther away, or over the middle of the strings, tends to hear more of the whole. Both are tendencies, and pianos vary.',
    head: { diameterMm: 0, rods: 0, label: 'not a drum: see the string’s shapes', strikeSrc: 'PHYS-STRING' },
  },
  setting: {
    items: [
      { id: 'piano', label: 'the piano (the lesson’s instrument)', short: 'PIANO', note: 'Ringed in amber: the piano this lesson mics, with its pianist. A grand’s curved side usually faces the audience; an upright usually stands near a wall.', prov: { kind: 'sourced', src: 'SW-B', quote: 'Length 6\' 11" (211 cm)' }, tag: 'THE PIANO', scene: 'all' },
      { id: 'bench', label: 'the pianist and the bench', short: 'PIANIST', note: 'The pianist’s hands sweep the whole keyboard and their feet work the pedals: no stand, mic or cable goes in their reach, by their feet, or across their sight line to the music.', prov: { kind: 'illustrative', reason: 'proposal §5' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'desk', label: 'the music on the desk', short: 'MUSIC', note: 'The pianist reads the music on the desk: a stand or boom across their sight line is in the way, whatever it sounds like.', prov: { kind: 'illustrative', reason: 'proposal §5: sight line to the music desk' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'singer', label: 'a singer beside the piano', short: 'SINGER', note: 'A singer with a vocal mic close to the piano: the piano mics hear the voice, and the vocal mic hears the piano. Where the two go together belongs to the ensembles lab.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL BOTH WAYS', scene: 'kit' },
      { id: 'wedge.pianist', label: 'the pianist’s wedge (monitor)', short: 'PIANO WEDGE', note: 'A floor monitor by the bench so the pianist hears the band — loud, close, and below the rim.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'fill.side', label: 'a side-fill speaker on a stand', short: 'SIDE-FILL', note: 'A speaker on a stand at the side of the stage, at about head height, facing the players: it can reach a mic under the lid through the gap above the rim.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the rest of the band', short: 'BAND', note: 'Drums, amplifiers and other players nearby: they all reach the piano mics. Closer, directional mics and a lower lid help the piano stand out.', prov: { kind: 'illustrative', reason: 'a generic band area' }, tag: 'SPILL', scene: 'stage' },
      { id: 'pa', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic piano; the PA adds what the room needs — and the piano’s mics must not feed the PA back into themselves.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'pair', label: 'a pair of mics outside the curve', short: 'OUTSIDE PAIR', note: 'In a good room, a pair on one stand just outside the curved side, roughly level with the rim, can take in the whole instrument and the room.', prov: { kind: 'sourced', src: 'DPA-PIANO', quote: 'a pair of omnis just outside the piano on a microphone stand spaced 30 cm (12 in) apart' }, tag: 'ROOM VIEW', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no monitors on the floor; a room worth hearing becomes part of the piano’s sound.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors and side-fills feed the players, the PA faces the audience, and the band is loud. Spill and the gain available before feedback push toward closer, directional mics and a lower lid.',
    studio: 'STUDIO: no monitors on the floor, repeated trials when the pianist pauses, and — in a good room — the room itself can be part of the sound: outside pairs, or closer mics for definition.',
  },
  diagnostic,
  practice: {
    task: 'Choose a piano setup for a given instrument, room and performance, describe an alternative, and explain what would justify a second mic. With a real piano and the pianist’s and owner’s agreement, you can record what you tried below.',
    fields: [
      { id: 'piano', label: 'Piano (grand, baby grand, upright; size)', kind: 'text' },
      { id: 'lid', label: 'Lid or top', kind: 'choice', choices: ['full stick', 'short stick', 'closed', 'off', 'upright top open', 'upright top closed'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'dynamic, cardioid', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which surface', kind: 'text' },
      { id: 'pair', label: 'Second mic, and the mono check', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown): the unknowns in words; `dims` ties each to
  // the placeholders it covers (validateLesson checks every one is listed).
  unknowns: [
    { text: 'The strings’ height above the floor (780 mm: key tops 720 + 60) — so no HEIGHT-above-floor readout is shown.', dims: ['yFloor'] },
    { text: 'Clearances over the strings, the frame and the dampers, under the lid, and from the upright’s action — ILLUSTRATIVE values for the owner to approve.', dims: ['gp', 'bg', 'up'] },
    { text: 'The lid’s angles (drawn 26° on the full stick, 11° on the short), the stick’s socket, the rim height (150 mm above the strings, from the museum case depth), the lid’s front flap.', dims: [] },
    { text: 'Every inside position: the hammer line, the agraffes, the tuning pins, the damper row (the top 18 notes drawn without dampers), the bridges, the frame’s holes and struts, the soundboard, the string lengths below the longest (a drawing rule), the register bands (bass / middle / treble at ±200 mm).', dims: [] },
    { text: 'The upright’s inside: the soundboard 28–40 mm behind the strings, the hammer line 950 mm up, the panels, the open top lid leaning back 12°, a wall 40 cm behind.', dims: [] },
    { text: 'The octave span (164 mm) comes from a museum Bechstein (ca. 1893); the black keys are drawn centred on their white keys’ boundary.', dims: [] },
    { text: 'The pianist and bench (proposal §5): bench 760 × 360 at 480, head 1250 up, hands over the keys, feet on the pedals — drawn illustratively.', dims: [] },
    { text: 'The bands round the guides’ single figures (±5 cm), the outside pair’s 30 cm–1 m and its height, the under-the-piano 15–45 cm, the sound-hole 12–30 cm, the upright top 3–25 cm and inside 5–25 cm, the panel-off 6–20 cm — the lab’s drawing.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every piano, pianist and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a 2.1 m grand, a 1.55 m baby grand and a 1.32 m upright with their insides drawn from typical layouts, mic patterns and the two-mic comb as textbook shapes, and string and soundboard motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Set the lid first, and place real mics with the pianist stopped.',
  copy: PIANO_COPY,
};

/** The grand's curve point (for the tests). */
export const C11_CURVE = GB.curve;
