/**
 * E16 JAZZ BIG BAND — the lesson as DATA (the 2026-10-07 journey). Words from
 * the owner's lesson (docs/labs/miking/source_text/Jazz-Big-Band-Miking-
 * Technique.txt; "L<n>" in comments only); research in docs/labs/miking/
 * jazz_big_band/ and the Batch 3 brass and sax lessons; corrections G5-E16-*
 * in CORRECTIONS_LOG.md (the institutional wording → "a suggested trial",
 * "a qualified operator"; the .docx cross-references dropped; people and
 * products kept off the screen). Its
 * observation sheet is now the shared Lab 5 worksheet (worksheet.ts).
 * Suggested starting points; no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, PAIR_REASON, POWER_REASON, riggingDiag, SAFE_REASON, supportNeed } from '../shared/ensemble/ensembleItems.ts';
import { lab5Worksheet } from '../shared/ensemble/worksheet.ts';
import { BB_C, E16_MODEL, E16_PLACE, E16_SEATS, E16_SETUPS, E16_WEDGES, E16_ZONES } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a big band in brief — saxes, trombones, trumpets and the rhythm section, in rows on a stage or in a horseshoe in the studio — and see where each instrument’s sound leaves it. Shown, never played.',
    credit: { scenarios: ['bb.meet.1', 'bb.meet.2', 'bb.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'The rows stand at different distances from anything in front: reeds nearest and lowest, trombones next, trumpets highest and farthest back. Each horn speaks its own way, and the rhythm section sits to one side with its own sources — the amp, the piano lid, the kit.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the band — a main pair, the pair with rhythm support, a mic for every two horns, a mic on every horn; in the studio horseshoe, two M/S pairs and a ribbon on each horn. Then what to settle before any mic goes up.',
    credit: { scenarios: ['bb.set.1', 'bb.set.2', 'bb.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Plan from the score and the real seating; let the bandleader set the balance with the players. Choose how much independent control the job needs — the room and the music decide, not a channel count.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare a cardioid condenser, a moving-coil dynamic, a figure-8 ribbon and an instrument-mounted miniature by what they do — and check the loudest brass against each one.',
    credit: { scenarios: ['bb.mic.1', 'bb.mic.2', 'bb.mic.3', 'bb.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'Choose by the job: a condenser for detail and the main view, a dynamic for close horns and amps, a figure-8 ribbon to turn its sides on a neighbour. A pad helps only before the stage that overloads; follow each ribbon’s own manual on air and power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main pair yourself — closer, farther, higher — and see how the reeds and the rear brass trade places.',
    credit: { scenarios: ['bb.place.1', 'bb.place.2', 'bb.31', 'bb.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the band, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Close to the front row the reeds are prominent and the rear brass distant; a higher view, a little farther out in front, evens the rows. Compare at matched level, one change at a time; the band’s balance comes first.',
  },
  context: {
    title: 'Live sound and recording',
    goal: 'Turn the lead alto’s mic so a floor wedge sits in its rejection — and decide which channels the PA, the monitors and the stream really need.',
    credit: { scenarios: ['bb.ctx.1', 'bb.ctx.2', 'bb.ctx.studio', 'bb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the alto mic (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Start from the band’s acoustic sound in the room: reinforce what needs it — often bass, piano, vocals and soft solos — not everything. Fewer open mics, wedges in the real rejection, and a separate route for the room pair.',
  },
  twoMic: {
    title: 'The pair and a close mic',
    goal: 'The main pair and the lead alto’s close mic: see how much earlier the close mic hears the alto, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['bb.two.0', 'bb.two.1', 'bb.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'A close mic hears its player earlier than the pair: it can change the timbre, the attack and the apparent depth. Lower or move it before reaching for polarity or delay; one delay cannot align every moving player.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Distances, angles and the main position first; overload versus brightness; the support’s level and the handoff; the neighbours of a masked part — before adding level. Reduce a send at once when it rings.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a big-band plan in order, choose and justify a setup for two briefs, and explain section against individual pickup.',
    credit: { scenarios: ['bb.prac.order', 'bb.prac.gain', 'bb.prac.setup1', 'bb.prac.setup2', 'bb.prac.3', 'bb.need', 'bb.hole', 'bb.ms'], note: 'Put the plan in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The worksheet is optional.' },
    takeaway: 'Plan the band, establish a reference, compare one variable at a time, compare shared and individual pickup, add only the rhythm and solo channels a need justifies — and keep the smallest plan that meets the goal.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L5–L6, L69 · set L5, L119 · mic L26–L45, L120 · place L6, L64–L67 · ctx L97–L99 · two L70, L100–L102 · prac L121–L129. */
const scenarios: MikingScenario[] = [
  {
    id: 'bb.meet.1',
    page: 'meet',
    prompt: 'A pair sits close to the front row. How do the rows tend to sound?',
    options: ['The reeds prominent, the rear brass distant', 'The trumpets loudest, the saxes buried', 'All three rows heard in exact balance together'],
    correct: 'The reeds prominent, the rear brass distant',
    explain: 'Close to the front row, the saxes are much nearer than the trumpets at the back. A higher view, a little farther out in front, changes that relationship.',
    why: {
      'The trumpets loudest, the saxes buried': 'From close in front, the saxes are nearest — they come forward.',
      'All three rows heard in exact balance together': 'The rows sit at different distances; the pair hears that.',
    },
  },
  {
    id: 'bb.meet.2',
    page: 'meet',
    prompt: 'Where is a big band’s guitar heard from?',
    options: ['The loudspeaker of its amplifier', 'The guitar’s body, like an acoustic', 'The pickup inside its strings'],
    correct: 'The loudspeaker of its amplifier',
    explain: 'An electric guitar is heard from its amp’s speaker. Mic the speaker; a direct feed is a separate electrical comparison.',
    why: {
      'The guitar’s body, like an acoustic': 'An electric guitar’s body is quiet; the amp makes the sound.',
      'The pickup inside its strings': 'The pickup sends a signal to the amp; the sound leaves the amp.',
    },
  },
  {
    id: 'bb.meet.3',
    page: 'meet',
    prompt: 'Why can a sax mic hearing only the bell misrepresent the section?',
    options: ['The saxes also speak from their tone holes', 'Bells are too quiet for a close mic', 'The baritone has no bell to speak of'],
    correct: 'The saxes also speak from their tone holes',
    explain: 'A bell-only perspective misses the body’s tone holes and can misrepresent the section across its range — the baritone’s articulation included.',
    why: {
      'Bells are too quiet for a close mic': 'Level is not the issue; the bell is only part of the sound.',
      'The baritone has no bell to speak of': 'The baritone has a large bell; it also speaks from its holes.',
    },
  },
  {
    id: 'bb.set.1',
    page: 'setups',
    prompt: 'The usual layout puts saxes in front. What do you do on the day?',
    options: ['Confirm the band’s actual seating first', 'Move the players into the usual three rows', 'Mic the usual layout and hope it fits'],
    correct: 'Confirm the band’s actual seating first',
    explain: 'Get the seating chart, solo cues, doubles, mutes and the rhythm section’s needs. Confirm the actual layout rather than imposing a common arrangement.',
    why: {
      'Move the players into the usual three rows': 'The band seats itself for its music; plan from what is there.',
      'Mic the usual layout and hope it fits': 'A plan for another layout misplaces every mic.',
    },
  },
  {
    id: 'bb.set.2',
    page: 'setups',
    prompt: 'Who sets the musical balance between the rows?',
    options: ['The bandleader, with the players', 'The engineer, with the faders', 'The loudest section, on the night'],
    correct: 'The bandleader, with the players',
    explain: 'The bandleader establishes the balance with the players first; the engineer then chooses the perspective or support that preserves it for the listener.',
    why: {
      'The engineer, with the faders': 'The faders preserve a balance; the band creates it.',
      'The loudest section, on the night': 'That is the problem a rehearsed balance prevents.',
    },
  },
  hearingCheck('bb', 'setups', 'a big band’s brass peaks'),
  {
    id: 'bb.mic.1',
    page: 'microphone',
    prompt: 'You turn a figure-8 ribbon’s side toward a loud neighbour. What else do you check?',
    options: ['What its back lobe hears', 'Nothing: figure-8s hear only the front', 'That its front faces the floor'],
    correct: 'What its back lobe hears',
    explain: 'A figure-8 rejects at its sides but hears equally from its back. Check what lies behind it — in a horseshoe, that can be the other side of the U.',
    why: {
      'Nothing: figure-8s hear only the front': 'Its back hears as much as its front, with opposite polarity.',
      'That its front faces the floor': 'Its front faces the horn; the question is what is behind it.',
    },
  },
  {
    id: 'bb.mic.2',
    page: 'microphone',
    prompt: 'The trumpet mic distorts on hard attacks. Where does a pad help?',
    options: ['Only before the stage that overloads', 'Anywhere in the chain, as long as it’s on', 'On the fader, at the very end of the chain'],
    correct: 'Only before the stage that overloads',
    explain: 'A pad solves overload only in the part of the signal path it comes before. Clipping at the capsule or the mic’s electronics cannot be repaired by a later fader.',
    why: {
      'Anywhere in the chain, as long as it’s on': 'After the overloaded stage it only turns the distortion down.',
      'On the fader, at the very end of the chain': 'The fader comes after the clipping.',
    },
  },
  {
    id: 'bb.mic.3',
    page: 'microphone',
    prompt: 'A ribbon is patched in. Does it get phantom power?',
    options: ['Follow that model’s own manual', 'On, as ribbons need it to work', 'Off, as it ruins ribbons'],
    correct: 'Follow that model’s own manual',
    explain: 'Some ribbons are passive and must not be cross-patched with phantom present; active models need power. Mute outputs before changing connections and check the mic, cable and input.',
    why: {
      'On, as ribbons need it to work': 'Passive ribbons need none — and a miswired line can damage them.',
      'Off, as it ruins ribbons': 'Active ribbons need power; the manual says which yours is.',
    },
  },
  {
    id: 'bb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The guitar floods the horn mics. First?',
    options: ['Turn or lower the amp, with the player', 'Add a direct feed and drop the amp mic', 'Move the horn mics nearer the amp'],
    correct: 'Turn or lower the amp, with the player',
    explain: 'With the player’s agreement, turn the amp or lower it. A direct feed is an electrical comparison, separate from miking the speaker.',
    why: {
      'Add a direct feed and drop the amp mic': 'The amp is still loud in the room and in every horn mic.',
      'Move the horn mics nearer the amp': 'That makes the spill worse.',
    },
  },
  {
    id: 'bb.place.1',
    page: 'placement',
    prompt: 'In the pair, the reeds are loud and the trumpets far away. First change?',
    options: ['Raise the pair and move it back a little', 'Add a mic on each trumpet straight away', 'Turn the whole band down at the desk'],
    correct: 'Raise the pair and move it back a little',
    explain: 'A higher view, a little farther out in front, evens the distances to the rows. Change one thing at a time, compared at matched level — supports only for what is still missing.',
    why: {
      'Add a mic on each trumpet straight away': 'Spots first hide a placement problem with more channels.',
      'Turn the whole band down at the desk': 'Level changes every row equally; the distances still differ.',
    },
  },
  {
    id: 'bb.place.2',
    page: 'placement',
    prompt: 'One side of the shared sax mic is weak. What do you check first?',
    options: ['Aim, player distance, a stand in the way', 'The channel’s gain for the whole section', 'The other side’s players, to quieten them'],
    correct: 'Aim, player distance, a stand in the way',
    explain: 'A nearer player and one farther off the axis are not equivalent. Check the capsule’s aim, the distances and any music stand in the path before raising the whole section.',
    why: {
      'The channel’s gain for the whole section': 'Gain raises the strong side too.',
      'The other side’s players, to quieten them': 'The players set the music; the mic’s coverage is the question.',
    },
  },
  noThreeToOne('bb', 'placement'),
  {
    id: 'bb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why are the trumpets up on the highest riser?',
    options: ['So their bells clear the rows in front', 'So their mics can be on the floor', 'So the trombones can hear them less'],
    correct: 'So their bells clear the rows in front',
    explain: 'On the highest riser — seated in many bands, standing in others, as drawn here — the trumpets play over the trombones and saxes in front — and a main pair from an elevated view hears them more evenly with the rows.',
    why: {
      'So their mics can be on the floor': 'Their mics follow the bells, up on the riser.',
      'So the trombones can hear them less': 'The trombones still hear them; the bells clear the heads in front.',
    },
  },
  {
    id: 'bb.ctx.1',
    page: 'context',
    prompt: 'You double the open horn mics. Roughly what happens to the margin?',
    options: ['About 3 dB less before feedback', 'About 3 dB more before feedback', 'No change while they are cardioids'],
    correct: 'About 3 dB less before feedback',
    explain: 'A simplified acoustic-gain model predicts about 3 dB less margin each time comparable open mics double — a planning estimate, not a measured guarantee. More channels need a musical reason.',
    why: {
      'About 3 dB more before feedback': 'More open mics add more paths, not more margin.',
      'No change while they are cardioids': 'Every open mic adds its path, whatever its pattern.',
    },
  },
  {
    id: 'bb.ctx.2',
    page: 'context',
    prompt: 'Inputs are short. The trumpet is clear everywhere; the piano is lost. Which mic?',
    options: ['The piano, before a trumpet mic', 'The trumpet first, as the lead part', 'Neither: add a second pair instead'],
    correct: 'The piano, before a trumpet mic',
    explain: 'Prioritise the sources that need reinforcement, then exposed solos, then section correction. A trumpet already audible everywhere needs less help than a masked piano.',
    why: {
      'The trumpet first, as the lead part': 'It already reaches the audience; the piano does not.',
      'Neither: add a second pair instead': 'A distant pair adds room and spill, not the piano.',
    },
  },
  {
    id: 'bb.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A horseshoe with two M/S pairs and spots. Is it phase-coherent?',
    options: ['Check it: M/S does not guarantee that', 'Coherent: the M/S pairs see to that', 'Unusable: a horseshoe cannot be recorded'],
    correct: 'Check it: M/S does not guarantee that',
    explain: 'The horseshoe is a studio concept to try in the room and in rehearsal. Mid-Side does not automatically resolve the timing differences with every spot — listen in mono.',
    why: {
      'Coherent: the M/S pairs see to that': 'Each spot still hears its player earlier than the pairs.',
      'Unusable: a horseshoe cannot be recorded': 'It can — it is one studio layout to try in the room.',
    },
  },
  {
    id: 'bb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does the main pair’s signal go during the show?',
    options: ['The recording or stream, not the wedges', 'Into the wedges, for a natural sound', 'Into the PA, as the main source of the mix'],
    correct: 'The recording or stream, not the wedges',
    explain: 'Keep the main or room pair on a separate recording or stream route unless the PA design specifically needs it. Remote listeners do not hear the band in the room.',
    why: {
      'Into the wedges, for a natural sound': 'A distant pair in the wedges invites feedback.',
      'Into the PA, as the main source of the mix': 'A distant pair in the PA hears the PA back.',
    },
  },
  {
    id: 'bb.two.0',
    page: 'twoMic',
    prompt: 'The lead alto stands for a solo at its spot. What else hears the solo?',
    options: ['The section mics and the pair too', 'Only the solo spot, while it is up', 'Nothing until the handoff is over'],
    correct: 'The section mics and the pair too',
    explain: 'The solo also enters the section mics and the pair: hear the combined result, and avoid an abrupt change of timbre or place when the spot comes in.',
    why: {
      'Only the solo spot, while it is up': 'Every open mic near the player hears it.',
      'Nothing until the handoff is over': 'The other mics hear the solo the whole time.',
    },
  },
  {
    id: 'bb.two.1',
    page: 'twoMic',
    prompt: 'The spot and the pair sound hollow together. What is a polarity flip for?',
    options: ['A diagnostic, judged by ear', 'The fix that aligns the two mics', 'A rule for each support mic'],
    correct: 'A diagnostic, judged by ear',
    explain: 'A polarity reversal is a diagnostic: it changes the sign, not the arrival time. Lower or move the support first; one delay cannot align every moving player.',
    why: {
      'The fix that aligns the two mics': 'It changes the sign; the time difference stays.',
      'A rule for each support mic': 'No such rule: each pair of mics is judged by ear.',
    },
  },
  {
    id: 'bb.two.2',
    page: 'twoMic',
    prompt: 'Should you time-align the two sides of a spaced main pair?',
    options: ['Leave them: aligning erases its timing cues', 'Align them so that both sides arrive together', 'Align them, but only on the trumpets’ notes'],
    correct: 'Leave them: aligning erases its timing cues',
    explain: 'A spaced pair’s width comes partly from its arrival-time differences. Aligning its two sides merely erases those cues.',
    why: {
      'Align them so that both sides arrive together': 'Then the pair loses the timing that makes its image.',
      'Align them, but only on the trumpets’ notes': 'Aligning for one section misaligns the rest.',
    },
  },
  {
    id: 'bb.prac.gain',
    page: 'practice',
    prompt: 'How do you set the big band’s levels?',
    options: ['On the strongest planned passage', 'On a quiet reed chorus, then add', 'On the drums alone before the horns'],
    correct: 'On the strongest planned passage',
    explain: 'Set levels with the strongest planned passage, checking quiet reeds, brushes, vocals and solos too, and follow the venue’s hearing-exposure practice.',
    why: {
      'On a quiet reed chorus, then add': 'The first full brass chord would overload.',
      'On the drums alone before the horns': 'The horns’ peaks are the ones to check.',
    },
  },
  {
    id: 'bb.prac.3',
    page: 'practice',
    prompt: 'You have 13 horn mics but 8 tracks. What does a section submix cost?',
    options: ['Its balance can’t be separated later', 'Nothing: tracks can be split again later', 'Only some headroom on the recorder'],
    correct: 'Its balance can’t be separated later',
    explain: 'Distinguish mic count from track count: a section submix commits balance decisions that cannot be separated later. Keep individual tracks when the system and project call for them.',
    why: {
      'Nothing: tracks can be split again later': 'A mixed track cannot be unmixed into its mics.',
      'Only some headroom on the recorder': 'The cost is the lost balance choices, not headroom.',
    },
  },
  supportNeed('bb', 'practice', 'a part the rows hide'),
  abHole('bb', 'practice'),
  msMono('bb', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'bb.s.dom',
    observation: 'One player dominates a shared section mic',
    firstChecks: 'Compare the players’ distances and off-axis angles to the capsule; adjust the target, or reconsider shared coverage.',
    options: ['Compare distances and angles; re-aim', 'Turn the shared mic’s gain right down', 'Ask that player to stop playing so loud'],
    correct: 'Compare distances and angles; re-aim',
    explain: 'A nearer or more on-axis player dominates. Re-aim or move the capsule — or give the parts separate mics.',
    why: { 'Turn the shared mic’s gain right down': 'Gain lowers both players together.', 'Ask that player to stop playing so loud': 'The part is the part; the coverage is the question.' },
  },
  {
    id: 'bb.s.harsh',
    observation: 'The trumpets are harsh or distort',
    firstChecks: 'Overload or brightness? Check the mic’s and preamp’s headroom, then compare a view off the bell’s axis.',
    options: ['Overload or brightness? Headroom, then angle', 'Cut the treble on each trumpet channel', 'Ask the trumpets to play more softly'],
    correct: 'Overload or brightness? Headroom, then angle',
    explain: 'Tell overload from brightness first: headroom at the right stage, then a modest angle off the bell.',
    why: { 'Cut the treble on each trumpet channel': 'EQ cannot repair clipping, and dulls them.', 'Ask the trumpets to play more softly': 'The band plays its music; fix the capture.' },
  },
  {
    id: 'bb.s.reeds',
    observation: 'The reeds disappear behind the brass',
    firstChecks: 'Revisit the main position and height and the sax coverage; add support only for the missing balance.',
    options: ['Main position and sax coverage first', 'Push each sax mic up by the same amount', 'Move the trumpets off their riser'],
    correct: 'Main position and sax coverage first',
    explain: 'Check the main view and the sax coverage; then a support for what is still missing.',
    why: { 'Push each sax mic up by the same amount': 'Raising every sax mic also raises the brass in them.', 'Move the trumpets off their riser': 'The band’s seating is the band’s; fix the capture first.' },
  },
  {
    id: 'bb.s.solo',
    observation: 'A solo spot makes the tone hollow or the image jump',
    firstChecks: 'Listen with the section and the main pair, in mono; reduce or move the spot, or revise the handoff cue.',
    options: ['In mono: reduce or move the spot', 'Flip its polarity and leave it there', 'Pan the spot hard to the far side'],
    correct: 'In mono: reduce or move the spot',
    explain: 'The spot hears the soloist earlier than the pair: lower it, move it, or rehearse the handoff.',
    why: { 'Flip its polarity and leave it there': 'A flip is a test, not a fix for a time difference.', 'Pan the spot hard to the far side': 'Then the soloist jumps across the picture.' },
  },
  {
    id: 'bb.s.mask',
    observation: 'The piano or bass is masked',
    firstChecks: 'Inspect the nearby drums and amps, the target and the working distance before adding low-frequency level.',
    options: ['Check neighbours, target and distance', 'Boost the lows until it comes through', 'Add a second mic of the same kind'],
    correct: 'Check neighbours, target and distance',
    explain: 'A masked piano or bass is often its neighbours in its mic: check them, its aim and distance first.',
    why: { 'Boost the lows until it comes through': 'Low boost lifts the drum and amp spill too.', 'Add a second mic of the same kind': 'Another open mic adds more spill.' },
  },
  {
    id: 'bb.s.fb',
    observation: 'Feedback starts during the loud passages',
    firstChecks: 'Reduce the affected send at once; inspect the monitor and speaker angles, the open channels and the changing bell directions.',
    options: ['Pull that send; fix angles and open mics', 'Notch it and push the level a little more', 'Turn the wedges toward the horn mics'],
    correct: 'Pull that send; fix angles and open mics',
    explain: 'Lower the affected send immediately, then the geometry and the open-channel count. Never sustain feedback.',
    why: { 'Notch it and push the level a little more': 'Working at the edge of feedback is never the plan.', 'Turn the wedges toward the horn mics': 'That points the loop straight at the mics.' },
  },
  {
    id: 'bb.s.thump',
    observation: 'A thump when a soloist stands up',
    firstChecks: 'A stand or cable knocked by a chair or foot? Re-route cables from chairs and the solo path; move the stand clear.',
    options: ['Re-route cables; clear the solo path', 'Gate the channel during the solo', 'Ask soloists to stand more slowly'],
    correct: 'Re-route cables; clear the solo path',
    explain: 'Protect cables from chair movement, pedals, slides and mutes, and keep the soloist’s route clear.',
    why: { 'Gate the channel during the solo': 'The thump is the stand moving; the gate opens anyway.', 'Ask soloists to stand more slowly': 'The players move as they play; dress the cables.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'bb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A concert in a good hall, recorded; the band balances itself well. Phantom power on every input.',
    setups: [
      { id: 'a', label: 'A main pair about 2.5 m in front, elevated, plus piano and bass support', ok: true, power: 'phantom', feedback: 'A concert perspective with selective detail from the rhythm section.' },
      { id: 'b', label: 'The pair, plus a mic for every two horns, raised under it', ok: true, power: 'phantom', feedback: 'Fair: some section control under the main view.' },
      { id: 'c', label: 'A close mic on every horn and no main view', ok: false, power: 'phantom', feedback: 'No room perspective, and many overlapping paths for a balanced band.' },
      { id: 'd', label: 'A pair 50 cm from the lead alto', ok: false, power: 'phantom', feedback: 'The alto dominates; the rows behind are far away.' },
      { id: 'e', label: 'A boom over the trumpets, untested, to reach them', ok: false, power: 'phantom', feedback: 'Nothing over the players without a safe, approved mount.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, BRAND_REASON, { id: 'r.count', label: 'More channels always sound better', role: 'wrong', feedback: 'Channels need a musical reason; each adds spill and open mics.' }],
    explain: 'More than one setup passes. What passes is the reasoning: a main view first, supports for a stated need, safe stands.',
  },
  {
    id: 'bb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud club with a PA and a live stream; soloists change often. Phantom power on the split.',
    setups: [
      { id: 'a', label: 'Close mics on the horns and rhythm for the PA; a pair for the stream only', ok: true, power: 'phantom', feedback: 'Roles kept apart: the PA from close mics, the stream with the room.' },
      { id: 'b', label: 'Shared section mics, plus piano, bass and a solo spot', ok: true, power: 'phantom', feedback: 'Fair: fewer open mics, solos covered — the nearest player may dominate.' },
      { id: 'c', label: 'The main pair alone, sent to the PA and the wedges', ok: false, power: 'phantom', feedback: 'A distant pair in the PA and wedges invites feedback.' },
      { id: 'd', label: 'Every mic open all night, faded only by ear', ok: false, power: 'phantom', feedback: 'Unneeded open mics cost margin; attenuate them when not needed.' },
      { id: 'e', label: 'Push the wedges until they ring, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback.' },
    ],
    reasons: [{ id: 'r.roles', label: 'Each channel has a route: PA, monitors, or stream', role: 'required', feedback: 'Say why: remote listeners need a different balance from the room.' }, SAFE_REASON, POWER_REASON, BRAND_REASON, { id: 'r.room', label: 'The room pair makes the PA sound natural', role: 'wrong', feedback: 'In the PA, a distant pair mostly hears the PA.' }],
    explain: 'Two setups pass. What passes is the reasoning: clear routes, close mics where the PA needs them, fewer open mics, no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of what is behind the alto mic?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 2 m to 3 m in front and higher. What changes most?', options: ['The rows even out, with more room', 'Only the level', 'The saxes dominate more'], after: 'Farther and higher, the distances to the saxes and the trumpets even out: the NEAR / FAR readout shrinks. Compare at matched level.' },
  context: { prompt: 'The wedge sits in front of the saxes on the floor. Can the alto mic’s rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The pair and the lead alto’s mic. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'bb.q.1',
    covers: 'meet',
    prompt: 'From close in front of a big band, which row comes forward?',
    options: ['The saxes in front', 'The trumpets at the back', 'All rows equally'],
    correct: 'The saxes in front',
    explain: 'The front row is nearest; the rear brass sounds distant from close in front.',
    why: { 'The trumpets at the back': 'They are the farthest away from that position.', 'All rows equally': 'The rows sit at different distances.' },
  },
  {
    id: 'bb.q.2',
    covers: 'meet',
    prompt: 'Where does a figure-8 ribbon reject?',
    options: ['At its sides', 'At its back', 'Nowhere at all'],
    correct: 'At its sides',
    explain: 'A figure-8 hears its front and back equally and rejects its sides.',
    why: { 'At its back': 'Its back hears as much as its front.', 'Nowhere at all': 'Its sides are deep nulls.' },
  },
  {
    id: 'bb.q.3',
    covers: 'meet',
    prompt: 'What speaks for an electric guitar in the band?',
    options: ['Its amp’s loudspeaker', 'Its wooden body', 'Its strings in the air'],
    correct: 'Its amp’s loudspeaker',
    explain: 'Mic the speaker; a direct feed is a separate comparison.',
    why: { 'Its wooden body': 'The body is quiet; the amp makes the sound.', 'Its strings in the air': 'The strings drive the pickup; the amp speaks.' },
  },
  {
    id: 'bb.q.4',
    covers: 'setups',
    prompt: 'How many channels does a big band need?',
    options: ['What the room and the job need', 'One for each player, at least', 'As many as the desk has spare'],
    correct: 'What the room and the job need',
    explain: 'Choose the architecture from the room and the musical task, not a prescribed channel count.',
    why: { 'One for each player, at least': 'A main pair and a few supports can be right in a good room.', 'As many as the desk has spare': 'Spare inputs are not a reason; each open mic costs margin.' },
  },
  {
    id: 'bb.q.5',
    covers: 'setups',
    prompt: 'Before any mic, who sets the balance?',
    options: ['The bandleader and the players', 'The engineer, at the mixing desk', 'Whichever section plays loudest'],
    correct: 'The bandleader and the players',
    explain: 'The band establishes the balance; the mics preserve it for the listener.',
    why: { 'The engineer, at the mixing desk': 'The desk preserves a balance the band makes.', 'Whichever section plays loudest': 'An unrehearsed balance is the problem, not the plan.' },
  },
  riggingDiag('bb'),
];

export const E16_LESSON: EnsembleLesson = {
  id: 'E16',
  labId: 'ensembles',
  title: 'Jazz Big Band',
  subtitle: 'Rows of reeds and brass with a rhythm section: a main view, section mics or a mic on every horn — the band makes the balance',
  noun: { one: 'big band', many: 'big bands' },
  model: E16_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8', 'saxDynSuper', 'instDynCard', 'sdcCard', 'lbRibbon'],
  zones: E16_ZONES,
  setupPairs: [
    { label: 'The main pair and the lead alto’s mic', A: { zone: 'bb.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'bb.sax', typeId: 'saxDynSuper', pattern: 'supercardioid' }, variants: ['rows'], line: 'The concert view with the lead alto’s line; check the sum in mono.' },
    { label: 'An M/S pair and a trumpet ribbon', A: { zone: 'hs.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'hs.tpt', typeId: 'lbRibbon', pattern: 'figure8' }, variants: ['horseshoe'], line: 'One side of the U and one trumpet’s detail; check the sum in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'bb.prac.order',
      page: 'practice',
      prompt: 'A big-band comparison, in order:',
      steps: [
        { text: 'Plan the band: rows, soloists, doubles, mutes, rhythm, monitors', early: 'Start from the seating chart and the score.' },
        { text: 'Establish a reference: acoustic, then one main view', early: 'Hear the band before comparing mics.' },
        { text: 'Compare one physical variable at matched loudness', early: 'One change at a time, on the same passage.' },
        { text: 'Compare a shared mic with a justified individual spot', early: 'Shared against individual comes after the reference.' },
        { text: 'Add one rhythm channel for a real need; check the routes', early: 'Rhythm and routing come once the horns are understood.' },
        { text: 'Keep the smallest plan that meets the goal', early: 'The final plan comes last.' },
      ],
      explain: 'Plan the band, set a reference, change one variable at a time, compare shared and individual pickup, integrate the rhythm and the routing — then keep the smallest arrangement that meets the goal.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A jazz big band: about five saxophones, four trombones, four trumpets and a rhythm section of piano, guitar, bass and drums — often with soloists, doubles and a singer.', src: 'ABSIL' },
    { title: 'WHAT IT ASKS OF YOU', text: 'Keep the sections’ blend while making solos and the rhythm section clear; control row balance, brass peaks, spill and the players’ movement.', src: 'LESSON-BIGBAND' },
    { title: 'HOW IT IS SEATED', text: 'Commonly saxes in front, trombones behind, trumpets at the back on the highest riser (seated in many bands, standing in some — drawn here standing), the rhythm section to one side. In the studio, some bands sit in a horseshoe instead.', src: 'EMAC-BB' },
    { title: 'ITS SIZE', text: 'The rows drawn here are about 4.5 m wide, the rhythm section beside them; the horseshoe about 5 m across. Typical layouts, not particular bands.', src: 'LESSON-BIGBAND' },
  ],
  sound: {
    stages: [
      { title: 'Three rows, three distances', text: 'Reeds nearest and lowest, trombones next, trumpets highest and farthest: anything in front hears the rows at different distances.' },
      { title: 'Each horn its own way', text: 'Brass from the bell, strongly directional; saxes from their tone holes and bells; the trombones’ slides moving in front of them.' },
      { title: 'The rhythm section beside', text: 'The piano under its lid, the bass from its body, the guitar from its amp, the kit from every drum and cymbal — loud neighbours for every horn mic.' },
    ],
    attack: 'Brass attacks and drum hits reach close mics first and hardest; the main view hears them softened by distance and the room.',
    body: 'The band blended in the room. A main pair hears the rows as the hall does; section and close mics hear their players with the band behind them. Tendencies — bands and rooms vary.',
    head: { diameterMm: 4500, rods: 0, label: 'a big band', strikeSrc: 'LESSON-BIGBAND' },
  },
  setting: {
    items: [
      { id: 'players', label: 'slides, mutes, standing soloists and the way in and out', short: 'PLAYERS', note: 'Clearance through full slide extension, mute changes and soloists standing; cables protected from chairs, pedals and feet; safe access routes.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'protect cables from chair movement, pedals, slides, mute handling and access routes (L119)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'rows', label: 'the rows behind', short: 'ROWS', note: 'Every horn mic hears the rows behind it and the brass above it: a sax mic hears trumpets, off its axis.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Microphone orientation also changes the tone of off-axis players (L6)' }, tag: 'SPILL', scene: 'all' },
      { id: 'rhythm', label: 'the drums, the amps and the piano lid', short: 'RHYTHM', note: 'The kit and the amps reach every nearby mic; agree the amp’s level and direction with the player; keep hardware clear before moving the piano lid.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Turn or lower the amp with the player’s agreement if it floods horn/piano mics (L86)' }, tag: 'SPILL', scene: 'all' },
      { id: 'mon', label: 'the wedges and the PA', short: 'MONITORS', note: 'Place speakers and wedges by each mic’s real rejection — rear lobes of supercardioids and figure-8s included; attenuate unneeded mics.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Place speakers and monitors relative to the actual mic rejection, including rear lobes (L98)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'routes', label: 'the PA, the monitors and the stream', short: 'ROUTES', note: 'Remote listeners do not hear the band in the room: keep the room pair on its own recording or stream route.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Keep the main/room pair on a separate recording or stream route (L97)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'rig', label: 'risers and anything above the band', short: 'RISERS', note: 'Approved risers, suspended arrays and structural attachments are the venue’s qualified crew’s work.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Approved risers, suspended arrays and structural attachments belong to qualified venue crew (L119)' }, tag: 'VENUE ONLY', scene: 'all' },
      { id: 'screens', label: 'screens and sightlines', short: 'SCREENS', note: 'Screens only when they improve useful separation without spoiling sightlines or cueing; compare the band’s sound after every seating change.', prov: { kind: 'sourced', src: 'LESSON-BIGBAND', quote: 'Use screens only when they improve useful separation without spoiling sightlines (L94)' }, tag: 'STUDIO', scene: 'studio' },
    ],
    stage: 'LIVE: start from the band’s acoustic sound at audience positions. Reinforce what needs it — often bass, piano, vocals and a soft solo; work closer where separation and gain are needed; attenuate mics not in use; a qualified operator manages the PA level.',
    studio: 'A RECORDING: a main pair or section view first for a room-led sound; for more control, place and check each horn mic in the planned seating, and keep individual tracks where the project calls for them.',
  },
  diagnostic,
  practice: {
    task: 'During an agreed rehearsal window: plan the band, establish a reference, compare one physical variable, compare a shared mic with an individual spot, add one necessary rhythm channel and check the routes, then keep the smallest plan that meets the goal. A qualified operator manages the PA level and any elevated equipment. With the band’s agreement, log your comparison on the worksheet below.',
    fields: lab5Worksheet({ seating: E16_SEATS.rows, noun: 'band' }),
  },
  unknowns: [
    { text: 'Row depths, chair spacing (0.9 m) and the risers (0.2 m under the trombones, 0.4 m under the standing trumpets) are drawing defaults; the orders of the rows and the rhythm section’s side follow common big-band practice.', dims: [] },
    { text: 'The horseshoe’s size (sides 4.8 m apart) and the two M/S pairs’ heights (1.5 m) are drawing defaults; the layout follows one studio account.', dims: [] },
    { text: 'The close mics’ directions are drawing defaults; their distances are each instrument’s starting points. The trumpet mics’ stands stand on the riser between the players; the shared trumpet mics stand between the trombone chairs.', dims: [] },
  ],
  live: { wedges: E16_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Big bands are recorded and reinforced in more than one way: a main pair with rhythm support, section mics, a mic on every horn. Choose from the room and the music, not a channel count. Every band, room and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical layouts, ideal patterns, straight paths and distances read from the drawing.',
  copy: { words: { ...ensembleWords('big band'), sheet: 'For a real band, with the bandleader’s, the players’ and the venue’s agreement. Two positions on the same rows: write tendencies in words — what you heard, not a promised result.' } },
  ensemble: {
    seatings: { rows: 'bb.standard', horseshoe: 'bb.horseshoe' },
    setups: E16_SETUPS,
    placeZones: E16_PLACE,
    worked: { rows: 'bbPair', horseshoe: 'hsOne' },
    meet: {
      figureTitle: 'A BIG BAND',
      figureBadge: 'From above, as the conductor faces it · a typical layout, not a particular band',
      sectionsNote: 'Saxes in front, trombones on a short riser behind them, trumpets at the back on the highest riser, drawn standing; piano, guitar, bass and drums on the conductor’s left. Switch SEATING for the studio horseshoe. Tap a section.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. The rows at three distances; the amp, the piano lid and the kit beside them.',
      mainAt: BB_C,
    },
    before: [
      { title: 'PLAN FROM THE SCORE', text: 'The seating chart, solo cues, doubles, mutes, vocal features and the rhythm section’s needs; mark the risers, the monitors, the piano lid, the amps and the safe routes.' },
      { title: 'LISTEN', text: 'A quiet reed passage, a full brass chord, a solo handoff and the strongest passage — at safe levels.' },
      { title: 'LET THE BAND BALANCE', text: 'The bandleader sets the balance with the players; then choose the perspective or support that keeps it for the listener.' },
      { title: 'CHOOSE THE CONTROL', text: 'A main pair with rhythm support; section mics with solo spots; a mic on every horn; close sources for the PA with a separate room pair — by the room and the job.' },
    ],
    safety: 'Stable stands; cables protected from chairs, pedals, slides, mutes and access routes. Approved risers, suspended arrays and structural attachments are the venue’s qualified crew’s work. Set levels on the strongest planned passage and follow the venue’s hearing practice; follow each ribbon’s own manual on air and power; never sustain feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a big band: one main pair in front of the horns, from an elevated view — a place to start and compare, not a rule.',
      clearance: 'The stand in front of the band, clear of the soloists’ path and the audience’s way; its cable dressed flat and out of the walkways.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin with the main pair — about 2–3 m in front of the horn rows, from an elevated view; in the studio horseshoe, inside the U at about head height. Places to start and compare, not a best place.',
      'Change one variable at a time — fore and aft, then the height — and compare quiet reeds and a brass peak at matched level.',
      'The band sets its own balance; the pair captures it. Move the whole pair; a different spacing or angle is a different method.',
    ],
  },
};
