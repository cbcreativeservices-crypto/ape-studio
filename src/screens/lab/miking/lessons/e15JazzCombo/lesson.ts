/**
 * E15 JAZZ COMBO — the lesson as DATA (the 2026-10-07 journey). Words from
 * the owner's lesson (docs/labs/miking/source_text/Jazz-Combo-Miking-
 * Technique.txt; "L<n>" in comments only); research in docs/labs/miking/
 * jazz_combo/; corrections G4-E15-* in CORRECTIONS_LOG.md (the academy name,
 * the case-study names and the institutional wording are not carried; the amp move is
 * the research's confirmed one). A stage-plot lesson: the spill, open-mic
 * and 3:1 readouts are derived from the drawing (stagePlot.ts). Suggested
 * starting points; no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, POWER_REASON } from '../shared/ensemble/ensembleItems.ts';
import { E15_MODEL, E15_PLACE, E15_SETUPS, E15_WEDGES, E15_ZONES, MAIN_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a jazz combo on its stage — a piano or guitar group with bass, drums and a horn — and see where each sound leaves: the kit’s ride and brushes, the bass at its bridge, the piano under its lid, the horn’s bell and holes. Shown, never played.',
    credit: { scenarios: ['jz.meet.1', 'jz.meet.2', 'jz.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'A combo is a conversation with strong acoustic bleed: the drums and the horn are loud, the bass and the piano easily masked. Where the players stand and which way an amp faces set the balance before any mic does.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the stage — one main pair, the pair with a few supports, the kit view, close mics on every source, a hybrid for the stream, and the guitar amp turned away from the drums.',
    credit: { scenarios: ['jz.set.1', 'jz.set.2', 'jz.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Choose the architecture first: one main view, the view with a few supports, close mics, or a hybrid. Turn the loudest sources with the players’ agreement before adding a channel — and never let the layout get in the way of the music.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose the combo’s mics by what they do: a coincident or near-coincident pair for the group, small condensers for the bass and piano, a kit view from above, dynamics for a loud horn or amp.',
    credit: { scenarios: ['jz.mic.1', 'jz.ms', 'jz.mic.2', 'jz.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'A pair hears the conversation; a close mic hears one voice in it. X/Y and M/S stay predictable in mono; a spaced pair needs the room and the balance to justify it.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main pair yourself — closer, farther, higher — and see what changes for the soloist, the bass and the drums.',
    credit: { scenarios: ['jz.place.1', 'jz.place.2', 'jz.31', 'jz.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the players, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Change one thing at a time and compare at matched level. Closer, the front player dominates; farther back, more blend and more room. The pair moves as a unit.',
  },
  context: {
    title: 'The club and the stream',
    goal: 'Turn the bass mic so the bassist’s wedge sits in its rejection — and give each mic a role: the club’s PA, the wedges, the recording, the stream.',
    credit: { scenarios: ['jz.ctx.1', 'jz.ctx.2', 'jz.ctx.studio', 'jz.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the bass mic (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Reinforce only what the club lacks; build a separate balance for listeners who hear none of the room. Keep the pair out of the wedges, and at the first ring lower the send — never sustain feedback.',
  },
  twoMic: {
    title: 'The pair and a bass spot',
    goal: 'The main pair and the bass spot: see how much earlier the spot hears the bass, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['jz.first', 'jz.two.1', 'jz.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The relevant distance is the difference in paths from the bass to each mic. Polarity changes the sign, never the time. Lower or move the overlapping mic before reaching for polarity or a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'The players and the room first: their positions, the piano lid, the amp’s direction — then the pair and the supports — and only then EQ. Lower the send at the first ring.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a combo setup in order, choose and justify an architecture for two briefs, and say what one support adds and costs.',
    credit: { scenarios: ['jz.prac.order', 'jz.prac.gain', 'jz.prac.setup1', 'jz.prac.setup2', 'jz.prac.3', 'jz.prac.4', 'jz.prac.5'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the three reasoning cards. The observation sheet is optional.' },
    takeaway: 'Hear the group unamplified, agree its layout with the players, choose the architecture, add one justified support at a time, and keep the PA, the wedges and the stream as separate balances.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L5–L6, L31–L45 · set L7–L26 · mic L24 · place L24, L26 · ctx L51–L53 · two L50 · prac L71–L77. */
const scenarios: MikingScenario[] = [
  {
    id: 'jz.meet.1',
    page: 'meet',
    prompt: 'In a jazz kit, what often carries the time?',
    options: ['The ride, the hi-hat and the brushes', 'The kick drum, played on each beat of the bar', 'The toms between the phrases'],
    correct: 'The ride, the hi-hat and the brushes',
    explain: 'The ride, hi-hat and brush detail often carry the time — so a kit view from above is heard first, and overly close cymbal pickup can dominate.',
    why: {
      'The kick drum, played on each beat of the bar': 'A jazz kick is usually lighter and plays less; the cymbals carry the time.',
      'The toms between the phrases': 'Toms colour the fills; the time lives on the ride and hi-hat.',
    },
  },
  {
    id: 'jz.meet.2',
    page: 'meet',
    prompt: 'Where does a tenor sax’s sound leave?',
    options: ['From the bell and the open tone holes', 'From the bell alone, straight ahead', 'From the mouthpiece at the player’s lips'],
    correct: 'From the bell and the open tone holes',
    explain: 'A sax radiates beyond its bell: the open tone holes along the body sound too. A mic only into the bell hears part of it.',
    why: {
      'From the bell alone, straight ahead': 'The holes along the body radiate as well, especially on the lower notes.',
      'From the mouthpiece at the player’s lips': 'The reed starts the sound; it leaves from the holes and the bell.',
    },
  },
  {
    id: 'jz.meet.3',
    page: 'meet',
    prompt: 'The piano lid is open toward the audience. What does that change?',
    options: ['Where it projects and what nearby mics hear', 'Nothing a microphone could ever hear', 'Only the pianist’s view of the rest of the band'],
    correct: 'Where it projects and what nearby mics hear',
    explain: 'The lid sends much of the piano toward its open side — and the drums can reach in under it. Its direction changes the balance before any mic is set.',
    why: {
      'Nothing a microphone could ever hear': 'The lid reflects a large part of the piano’s sound; mics hear the difference.',
      'Only the pianist’s view of the rest of the band': 'It changes sightlines too, but its main effect is acoustic.',
    },
  },
  {
    id: 'jz.set.1',
    page: 'setups',
    prompt: 'The guitar amp is loud in the drum mics. What do you try first?',
    options: ['Turn the amp away from the drums, with the player', 'Gate the overheads hard to keep the guitar out of them', 'Raise the drums in the mix to cover the guitar'],
    correct: 'Turn the amp away from the drums, with the player',
    explain: 'Relocate or turn the loudest sources first, in agreement with the players. A guitar amp faced away from the drums puts less guitar in the drum mics.',
    why: {
      'Gate the overheads hard to keep the guitar out of them': 'A gate cannot remove the guitar while the drums are playing.',
      'Raise the drums in the mix to cover the guitar': 'Louder drums raise the guitar inside them too.',
    },
  },
  {
    id: 'jz.set.2',
    page: 'setups',
    prompt: 'The players want their usual close formation, no screens. What do you do?',
    options: ['Work with it: the layout serves the music', 'Insist on screens for clean separation', 'Spread them out across the whole stage'],
    correct: 'Work with it: the layout serves the music',
    explain: 'Ask what the players need — eye contact, an open room, their normal formation — and never make the layout get in the way of the performance. Bleed is part of a combo.',
    why: {
      'Insist on screens for clean separation': 'Screens change how the group hears itself; that is their call.',
      'Spread them out across the whole stage': 'Breaking the formation can break the conversation.',
    },
  },
  hearingCheck('jz', 'setups', 'a full chorus at club level'),
  {
    id: 'jz.mic.1',
    page: 'microphone',
    prompt: 'Which main pair is most predictable when summed to mono?',
    options: ['A coincident X/Y pair', 'A widely spaced pair of omnis', 'Two mics at either side of the stage'],
    correct: 'A coincident X/Y pair',
    explain: 'With the capsules together, both mics hear each player at the same time: no time differences to comb in mono. A spaced pair can comb-filter when summed.',
    why: {
      'A widely spaced pair of omnis': 'Spacing adds time differences — the cause of combing in mono.',
      'Two mics at either side of the stage': 'Far apart, they hear every player at different times.',
    },
  },
  msMono('jz', 'microphone'),
  {
    id: 'jz.mic.2',
    page: 'microphone',
    prompt: 'The bass has a pickup. What is its signal?',
    options: ['A separate electrical path, not a mic', 'The same as a mic, just a little quieter', 'The room’s sound of the bass'],
    correct: 'A separate electrical path, not a mic',
    explain: 'A bass pickup or an electric-piano DI is a separate signal. Compare it with the mic, alone and combined, before you blend them.',
    why: {
      'The same as a mic, just a little quieter': 'A pickup hears the string and body mechanically; it sounds different from a mic.',
      'The room’s sound of the bass': 'A pickup hears none of the room.',
    },
  },
  {
    id: 'jz.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why can the bass get lost in the group?',
    options: ['Drums and piano can mask it', 'It radiates only upward', 'Its strings are quieter than they look'],
    correct: 'Drums and piano can mask it',
    explain: 'The bass is low and wide; the kick and the piano’s low notes share its range — so it is often the first line to need a support.',
    why: {
      'It radiates only upward': 'It radiates round, and into the floor through its endpin.',
      'Its strings are quieter than they look': 'Level is not the issue; masking is.',
    },
  },
  {
    id: 'jz.place.1',
    page: 'placement',
    prompt: 'The pair is close and the sax dominates. First change?',
    options: ['Move the pair back, or the sax with the player', 'Add spots for everyone else in the band to balance', 'Turn the sax down on the mixing desk'],
    correct: 'Move the pair back, or the sax with the player',
    explain: 'Close in, the front player is much nearer than the rest. Move the pair farther back, or agree a step back with the player — one change at a time.',
    why: {
      'Add spots for everyone else in the band to balance': 'Spots first hide a placement problem with overlap.',
      'Turn the sax down on the mixing desk': 'The sax is in the pair itself: no fader separates it.',
    },
  },
  {
    id: 'jz.place.2',
    page: 'placement',
    prompt: 'Two pair positions sound different. How do you judge them fairly?',
    options: ['Same chorus, matched listening level', 'Whichever one sounds louder at first hearing', 'Two different tunes, for variety'],
    correct: 'Same chorus, matched listening level',
    explain: 'Compare on the same music at a consistent level, so louder never wins by itself; change one parameter at a time.',
    why: {
      'Whichever one sounds louder at first hearing': 'Louder tends to sound better at first — the comparison is unfair.',
      'Two different tunes, for variety': 'Different music changes the balance; compare like with like.',
    },
  },
  noThreeToOne('jz', 'placement'),
  {
    id: 'jz.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which way should a guitar amp face in a combo?',
    options: ['Away from the drums and soft sources', 'Straight at the drum overheads', 'At the main pair, for definition'],
    correct: 'Away from the drums and soft sources',
    explain: 'Faced away from the drums, the amp puts less guitar in the drum mics; its own mic, facing the speaker, hears it close.',
    why: {
      'Straight at the drum overheads': 'Then the guitar fills the drum mics.',
      'At the main pair, for definition': 'An amp aimed at the pair can dominate the whole picture.',
    },
  },
  {
    id: 'jz.ctx.1',
    page: 'context',
    prompt: 'The club needs reinforcement and the set is streamed. Where does the pair go?',
    options: ['The stream and the recording only', 'The wedges, so the band hears the room', 'The PA, to make the club sound bigger'],
    correct: 'The stream and the recording only',
    explain: 'Do not send the room pair to the players’ monitors by default. Close mics carry the PA; the pair gives the stream the space it cannot hear.',
    why: {
      'The wedges, so the band hears the room': 'A distant pair in the wedges is a quick route to feedback.',
      'The PA, to make the club sound bigger': 'A shared pair in a loud, monitored club is a poor default.',
    },
  },
  {
    id: 'jz.ctx.2',
    page: 'context',
    prompt: 'The drums and horns already fill the club. What does the PA add?',
    options: ['Only what the audience lacks', 'Everything, at a matching level', 'The drums, to keep the time clear'],
    correct: 'Only what the audience lacks',
    explain: 'Build the front-of-house mix from the sound already in the room: reinforce only what is missing — often the bass, the piano or a voice.',
    why: {
      'Everything, at a matching level': 'Doubling a loud acoustic source makes the room louder, not clearer.',
      'The drums, to keep the time clear': 'The drums usually need the least help in a small club.',
    },
  },
  {
    id: 'jz.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A trio that plays well together in a good room. Where do you start?',
    options: ['The main view first, then one support', 'A close mic on each source first', 'Screens and headphones for everyone'],
    correct: 'The main view first, then one support',
    explain: 'If the players and the room set the balance, start ensemble-first: hear the main view, then add a horn, bass or piano spot to correct one specific line.',
    why: {
      'A close mic on each source first': 'Close mics first lose the shared picture the trio makes.',
      'Screens and headphones for everyone': 'That separates a group whose strength is playing together.',
    },
  },
  {
    id: 'jz.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The open piano lid faces the audience. Where do the drums go?',
    options: ['Into the piano, under its lid', 'Nowhere near the piano or its mics', 'Only into the drum mics'],
    correct: 'Into the piano, under its lid',
    explain: 'The drums reach in under the open lid: a piano mic hears them too. The lid’s direction and the group’s geometry set how much.',
    why: {
      'Nowhere near the piano or its mics': 'On a small stage the drums reach every mic.',
      'Only into the drum mics': 'Sound does not stop at the mics meant for it.',
    },
  },
  {
    id: 'jz.first',
    page: 'twoMic',
    prompt: 'The bass spot is 4 m closer to the bass than the main pair. What happens?',
    options: ['It hears the bass about 12 ms earlier', 'Both mics hear the bass at the same time', 'The main pair hears the bass earlier'],
    correct: 'It hears the bass about 12 ms earlier',
    explain: 'Sound travels about 1 m in 2.9 ms: 4 m is close to 12 ms. Summed, the early spot changes the depth and the low end — compare the pair alone, the spot alone and both.',
    why: {
      'Both mics hear the bass at the same time': 'They are at different distances, so the arrivals differ.',
      'The main pair hears the bass earlier': 'The spot is closer, so it hears the bass first.',
    },
  },
  {
    id: 'jz.two.1',
    page: 'twoMic',
    prompt: 'The pair plus the bass spot sound hollow in the low end. First change?',
    options: ['Lower or move the spot, then compare', 'Flip the polarity until it sounds fuller', 'Add a fixed delay from the distance'],
    correct: 'Lower or move the spot, then compare',
    explain: 'Lower or move an overlapping mic before treating polarity or time alignment as an automatic fix; then check the sum in mono and stereo.',
    why: {
      'Flip the polarity until it sounds fuller': 'A flip changes the sign, not the time difference behind the hollowness.',
      'Add a fixed delay from the distance': 'Distance alone sets no universal delay; placement comes first.',
    },
  },
  {
    id: 'jz.two.2',
    page: 'twoMic',
    prompt: 'You keep the room pair. How do you record it?',
    options: ['On its own tracks, to judge later', 'Mixed into the close mics, to save tracks', 'Only in mono, to avoid the combing'],
    correct: 'On its own tracks, to judge later',
    explain: 'If a room pair is kept, record it on separate tracks so the recording can be judged with and without it.',
    why: {
      'Mixed into the close mics, to save tracks': 'Then it can never be taken out or rebalanced.',
      'Only in mono, to avoid the combing': 'Mono throws away the space the pair is there for.',
    },
  },
  {
    id: 'jz.prac.gain',
    page: 'practice',
    prompt: 'How do you set the gain for a combo?',
    options: ['On the loudest horn and drum peaks', 'On the bass alone, as it is quietest', 'On the piano’s softest solo passage'],
    correct: 'On the loudest horn and drum peaks',
    explain: 'At a full-group peak, set gain for the loudest horn and drum events and leave headroom — then check the quiet solo too.',
    why: {
      'On the bass alone, as it is quietest': 'The first loud horn chorus would then overload.',
      'On the piano’s softest solo passage': 'The ensemble peaks would clip.',
    },
  },
  {
    id: 'jz.prac.3',
    page: 'practice',
    prompt: 'You add one support mic. What do you state about it?',
    options: ['Its audible advantage and its cost in spill', 'Its brand, its price and its frequency response', 'Only that it makes the line louder'],
    correct: 'Its audible advantage and its cost in spill',
    explain: 'Hear the main alone, the support alone and the sum at matched level, then in mono. State what it adds and what its spill costs.',
    why: {
      'Its brand, its price and its frequency response': 'Those describe the mic, not what it does to the band.',
      'Only that it makes the line louder': 'Louder is not a reason; clearer without detaching is.',
    },
  },
  {
    id: 'jz.prac.4',
    page: 'practice',
    prompt: 'A singer joins the combo. What about the instrumental pair?',
    options: ['Keep it out of the vocal monitor', 'Send it to the vocal monitor, for blend', 'Use it as the vocal mic too'],
    correct: 'Keep it out of the vocal monitor',
    explain: 'Use an individual vocal mic suited to the delivery and the monitors, and keep the instrumental pair out of the vocal monitor by default.',
    why: {
      'Send it to the vocal monitor, for blend': 'A distant pair in a monitor feeds back easily.',
      'Use it as the vocal mic too': 'Intelligibility and feedback usually need the singer’s own mic.',
    },
  },
  {
    id: 'jz.prac.5',
    page: 'practice',
    prompt: 'The first feedback ring starts during a quiet solo. What do you do?',
    options: ['Lower the send, then fix the geometry', 'Hold it a moment to find its frequency', 'Raise the soloist above the ring'],
    correct: 'Lower the send, then fix the geometry',
    explain: 'At the first ring, lower the affected send; then correct the mic position, the open-channel count and the speaker and monitor geometry. Never sustain feedback.',
    why: {
      'Hold it a moment to find its frequency': 'Sustaining feedback risks ears and equipment — never on purpose.',
      'Raise the soloist above the ring': 'More gain feeds the ring.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'jz.s.horn',
    observation: 'The horn overwhelms the room image',
    firstChecks: 'The horn’s relationship to the pair? Change it with the musicians’ agreement; then reduce the support mic or adjust the main view.',
    options: ['Change the horn-to-pair geometry', 'Turn the whole pair down at once', 'Add a compressor to the main pair'],
    correct: 'Change the horn-to-pair geometry',
    explain: 'Move the pair or agree a step back with the player first; then lower the horn’s support.',
    why: { 'Turn the whole pair down at once': 'That lowers everyone equally; the horn still dominates.', 'Add a compressor to the main pair': 'Compression brings everything else up under the horn.' },
  },
  {
    id: 'jz.s.bass',
    observation: 'The bass is muddy or disappears',
    firstChecks: 'Hear the mic, the pickup and the sum separately; reposition for articulation; check proximity and overlap with the kick and piano.',
    options: ['Hear mic, pickup and sum separately', 'Boost the bass channel’s low end', 'Move the bass mic onto the bridge'],
    correct: 'Hear mic, pickup and sum separately',
    explain: 'Find which path is muddy, then move the mic for articulation; proximity and overlap often cause it.',
    why: { 'Boost the bass channel’s low end': 'More low end adds more mud.', 'Move the bass mic onto the bridge': 'Never fix anything to the bridge without the owner’s and the maker’s approval.' },
  },
  {
    id: 'jz.s.ride',
    observation: 'The ride is too bright and the brushes are lost',
    firstChecks: 'Rebalance or change the drum overhead view before adding close channels; check a full drum passage.',
    options: ['Rebalance the overhead view first', 'Add a close mic on each cymbal', 'Cut the highs on the main pair'],
    correct: 'Rebalance the overhead view first',
    explain: 'The overhead’s height and aim set the ride against the brushes: move it before adding channels.',
    why: { 'Add a close mic on each cymbal': 'Close cymbal pickup makes the ride dominate even more.', 'Cut the highs on the main pair': 'That dulls the whole band, brushes included.' },
  },
  {
    id: 'jz.s.piano',
    observation: 'The piano is lost under the drums',
    firstChecks: 'The lid and the group’s geometry? Compare a closer piano view without interfering with the pianist.',
    options: ['Check the lid and the group geometry', 'Turn the drums down in the PA and wedges', 'Close the piano lid fully'],
    correct: 'Check the lid and the group geometry',
    explain: 'The lid’s direction and where the drums sit decide the balance; then try a closer piano view.',
    why: { 'Turn the drums down in the PA and wedges': 'The drums are acoustic and in the piano mics already.', 'Close the piano lid fully': 'A closed lid makes the piano quieter still.' },
  },
  {
    id: 'jz.s.mono',
    observation: 'The stereo sum turns thin in mono',
    firstChecks: 'Test the main pair and each support in mono; change positions or balance; check the M/S decoding if used.',
    options: ['Test the pair and supports in mono', 'Widen the pair to fix the image', 'Pan the supports hard left and right'],
    correct: 'Test the pair and supports in mono',
    explain: 'Find which combination cancels, then move or rebalance it.',
    why: { 'Widen the pair to fix the image': 'Wider usually makes mono worse.', 'Pan the supports hard left and right': 'Panning does not change what cancels in mono.' },
  },
  {
    id: 'jz.s.ring',
    observation: 'Live feedback or uncontrolled spill',
    firstChecks: 'Lower the affected monitor or house send, then reconsider the distance, the pattern, the speaker direction and the open mics.',
    options: ['Lower the send; then the geometry', 'Notch the ring and push on', 'Send the pair to the wedges'],
    correct: 'Lower the send; then the geometry',
    explain: 'Lower the level at once; then fix distance, pattern, monitor angle and open mics.',
    why: { 'Notch the ring and push on': 'Working at the edge of feedback is unstable.', 'Send the pair to the wedges': 'A distant pair in the wedges makes ringing likelier.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'jz.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A piano trio records in a good room; they play best without headphones, close together. Phantom power available.',
    setups: [
      { id: 'a', label: 'One X/Y pair in front, then one bass support if needed', ok: true, power: 'phantom', feedback: 'Ensemble-first: the trio’s balance, one support for a named need.' },
      { id: 'b', label: 'A pair plus a piano view and a bass mic, each raised from silence', ok: true, power: 'phantom', feedback: 'Fair: supports for definition under the main view.' },
      { id: 'c', label: 'Close mics only, the players behind screens', ok: false, power: 'phantom', feedback: 'That separates a group that plays best together.' },
      { id: 'd', label: 'A spaced pair 3 m apart right at the drums', ok: false, power: 'phantom', feedback: 'Wide and close: a hole in the middle, the drums on top.' },
      { id: 'e', label: 'A mic clipped to the bass bridge without asking', ok: false, power: 'phantom', feedback: 'Nothing is fixed to a valuable instrument without the owner’s approval.' },
    ],
    reasons: [
      { id: 'r.main', label: 'The main view first, supports for a stated need', role: 'required', feedback: 'Say why: the players set the balance.' },
      { id: 'r.safe', label: 'Stands and cables clear of the pedals, the endpin and the players', role: 'required', feedback: 'Safe placement is part of every passing setup.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'More than one setup passes. What passes is the reasoning: ensemble-first, supports only for a named need, nothing fixed to an instrument.',
  },
  {
    id: 'jz.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A quartet in a loud club with wedges and a PA; the set is also streamed. Phantom power on the split.',
    setups: [
      { id: 'a', label: 'Close mics to the PA; the room pair to the stream only', ok: true, power: 'phantom', feedback: 'The hybrid: each audience gets its own balance.' },
      { id: 'b', label: 'Close mics to the PA and the stream, an audience pair added for the stream', ok: true, power: 'phantom', feedback: 'Fair, with the pair kept out of the wedges.' },
      { id: 'c', label: 'One shared main pair for the PA, wedges and stream', ok: false, power: 'phantom', feedback: 'A poor default for a loud, monitored stage.' },
      { id: 'd', label: 'The room pair in every wedge so the band hears the room', ok: false, power: 'phantom', feedback: 'Distant mics in the wedges invite feedback.' },
      { id: 'e', label: 'Push the PA until it rings, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback.' },
    ],
    reasons: [
      { id: 'r.roles', label: 'Each mic has a role: PA, wedges, stream', role: 'required', feedback: 'Explicit roles keep the pair out of the wedges.' },
      { id: 'r.close', label: 'Close pickup for the PA in a loud room', role: 'required', feedback: 'Close mics give the gain before feedback a distant pair cannot.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'Two setups pass. What passes is the reasoning: close mics for the PA, the pair for the stream, no distant mics in the wedges, no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the stage behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 1.5 m to 3 m in front. What changes most?', options: ['More blend and more room', 'Only the level', 'The soloist dominates more'], after: 'Farther back, the distances to the front and back players even out: NEAR / FAR shrinks, and the room comes up. Compare at matched level.' },
  context: { prompt: 'The wedge sits in front of the bassist, below the bass mic. Can the mic’s rejection reach it?', options: ['Yes — aim the mic’s back toward it', 'No — only an omni can', 'It already sits in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The main pair and a bass spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'jz.q.1',
    covers: 'meet',
    prompt: 'What usually dominates a shared pair in a combo?',
    options: ['The drums or a horn', 'The upright bass', 'The pianist’s left hand'],
    correct: 'The drums or a horn',
    explain: 'With one main view, position sets the balance — and a drummer or a horn can dominate.',
    why: { 'The upright bass': 'The bass is more often the line that gets lost.', 'The pianist’s left hand': 'The piano is more often masked than dominant.' },
  },
  {
    id: 'jz.q.2',
    covers: 'meet',
    prompt: 'Where does a sax’s sound leave?',
    options: ['The bell and the open holes', 'The bell only, straight ahead', 'The mouthpiece, at the lips'],
    correct: 'The bell and the open holes',
    explain: 'A sax radiates beyond its bell, from the open tone holes along its body.',
    why: { 'The bell only, straight ahead': 'The holes along the body radiate too.', 'The mouthpiece, at the lips': 'The sound starts at the reed but leaves from the holes and bell.' },
  },
  {
    id: 'jz.q.3',
    covers: 'setups',
    prompt: 'The guitar amp spills into the drum mics. First move?',
    options: ['Turn the amp away from the kit', 'Gate the drum mics hard during solos', 'Close-mic each of the drums'],
    correct: 'Turn the amp away from the kit',
    explain: 'Turn or relocate the loudest sources first, with the players’ agreement.',
    why: { 'Gate the drum mics hard during solos': 'A gate cannot remove guitar while the drums play.', 'Close-mic each of the drums': 'More drum mics hear the amp too.' },
  },
  {
    id: 'jz.q.4',
    covers: 'setups',
    prompt: 'A loud club, wedges, and a stream. What feeds the PA?',
    options: ['Close mics on the sources', 'One shared main pair, for nature', 'A spaced omni pair up high'],
    correct: 'Close mics on the sources',
    explain: 'A single shared main pair is a poor default for a loud monitored stage; close pickup gives the PA its gain before feedback.',
    why: { 'One shared main pair, for nature': 'Natural for a recording, but a distant pair in the PA feeds back.', 'A spaced omni pair up high': 'An omni pair hears even more of the PA.' },
  },
  {
    id: 'jz.q.5',
    covers: 'setups',
    prompt: 'Where does a room pair go when a set is streamed?',
    options: ['The stream, not the wedges', 'The wedges, for the players', 'The PA, for size'],
    correct: 'The stream, not the wedges',
    explain: 'Keep the room pair out of the players’ monitors; give the stream the space it cannot hear.',
    why: { 'The wedges, for the players': 'Distant mics in the wedges feed back easily.', 'The PA, for size': 'A room pair in the PA hears the PA.' },
  },
  {
    id: 'jz.q.6',
    covers: 'setups',
    critical: true,
    prompt: 'A mic would sound best clipped to the bass bridge. What do you do?',
    options: ['Ask the owner; use a stand if unsure', 'Clip it on carefully between songs', 'Tape it to the bridge for the set'],
    correct: 'Ask the owner; use a stand if unsure',
    explain: 'No improvised clip or adhesive belongs on a valuable acoustic instrument; nothing is attached without the owner’s and the maker’s approval.',
    why: { 'Clip it on carefully between songs': 'An unapproved clip can damage a valuable instrument.', 'Tape it to the bridge for the set': 'Adhesive on an instrument is never yours to apply.' },
  },
];

export const E15_LESSON: EnsembleLesson = {
  id: 'E15',
  labId: 'ensembles',
  title: 'Jazz Combo',
  subtitle: 'A conversation with bleed: one main view, a few supports, close mics or a hybrid — and the amp turned away',
  noun: { one: 'jazz combo', many: 'jazz combos' },
  model: E15_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'sdcCard'],
  zones: E15_ZONES,
  setupPairs: [{ label: 'The main pair and a bass spot', A: { zone: 'jz.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'jz.ub', typeId: 'sdcCard', pattern: 'cardioid' }, line: 'A line clarified under the pair; check the sum in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'jz.prac.order',
      page: 'practice',
      prompt: 'A combo setup, in order:',
      steps: [
        { text: 'Hear the group unamplified; map who leads and where', early: 'Start by listening to what the group already sounds like.' },
        { text: 'Agree the layout with the players: amps, lid, sightlines', early: 'The layout comes before any mic.' },
        { text: 'One main view: a pair, or the kit view', early: 'The main view comes once the layout is agreed.' },
        { text: 'Add one justified support at a time', early: 'Supports come after the main view, for stated needs.' },
        { text: 'Check the sum in mono and stereo; set the roles', early: 'Checks come with the mics up.' },
      ],
      explain: 'Hear the group, agree its layout, set one main view, add one justified support at a time, then check mono and stereo and give every mic its role.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small jazz group — a piano trio, a horn with a rhythm section, a guitar group, or a singer with players — a conversation among players, often with strong bleed.', src: 'LESSON-JAZZ' },
    { title: 'WHAT IT ASKS OF YOU', text: 'A choice of architecture — one main view, a few supports, close mics, or a hybrid — for a studio, a club’s PA and a separate stream.', src: 'LESSON-JAZZ' },
    { title: 'HOW IT IS LAID OUT', text: 'This lab draws a typical club stage: the piano or the guitar on the audience’s left, the upright bass in the middle, the drums on the right, the horn out front.', src: 'LESSON-JAZZ' },
    { title: 'ITS SIZE', text: 'The group spreads about 6 m across. A typical layout, not a particular band.', src: 'LESSON-JAZZ' },
  ],
  sound: {
    stages: [
      { title: 'The kit’s time', text: 'The ride, the hi-hat and the brushes carry the time from above the kit; a closed jazz kick speaks from its front head.' },
      { title: 'The lines under it', text: 'The upright bass from its top and f-holes near the bridge, the piano off its open lid — both easily masked by the drums.' },
      { title: 'The voice out front', text: 'The horn from its bell (and a sax from its open holes too), the guitar from its amp’s speaker — loud, and pointed.' },
    ],
    attack: 'Stick, brush and pick attacks reach a close mic first; a main pair hears them softened by distance and the room.',
    body: 'The sustained group sound blended in the room: a main pair hears the conversation; a close mic hears one voice and the rest as bleed. Tendencies — groups and rooms vary.',
    head: { diameterMm: 6000, rods: 0, label: 'a jazz combo', strikeSrc: 'LESSON-JAZZ' },
  },
  setting: {
    items: [
      { id: 'players', label: 'the players’ eye contact and formation', short: 'PLAYERS', note: 'Ask whether they need eye contact, an open room, their normal formation or a screen; never make the layout get in the way of the performance.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'never make the room layout impede the performance (L5)' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'amp', label: 'the guitar amp’s direction', short: 'AMP', note: 'An amp aimed away from the drums, the piano or the bass mic puts less of it in their mics — agree it with the player.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'A guitar amp aimed away from a piano or bass microphone may reduce spill (L26)' }, tag: 'SPILL', scene: 'all' },
      { id: 'lid', label: 'the piano lid', short: 'LID', note: 'The lid changes where the piano projects and what nearby mics hear; keep stands clear of the pedals, the lid and the hands.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'a piano lid changes where it projects and what nearby microphones hear (L26)' }, tag: 'BALANCE', scene: 'all' },
      { id: 'endpin', label: 'the bass endpin, pedals and cables', short: 'KEEP CLEAR', note: 'Stabilise stands and keep cable paths clear of the players, the audience, chairs, the piano pedals and the bass endpin. No improvised clip or adhesive on a valuable instrument.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'Stabilize stands and isolate cable paths from players, audience, chair movement, piano pedals and bass endpin (L70)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'pa', label: 'the club PA and the wedges', short: 'PA', note: 'Reinforce only what the audience lacks; aim directional mics with the loudspeakers and monitors in mind; keep the pair out of the wedges.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'Reinforce only what the audience lacks (L52)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'stream', label: 'the stream or recording', short: 'STREAM', note: 'A separate balance for listeners who hear none of the room: the pair and the close mics in their own mix.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'a separate stream/recording balance for remote listeners (L53)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'screens', label: 'screens and headphones', short: 'SCREENS', note: 'Screens can improve separation but change how the group hears itself and the room’s tone — a conscious choice, with the players.', prov: { kind: 'sourced', src: 'LESSON-JAZZ', quote: 'Screens can improve separation but may change how the group hears itself (L26)' }, tag: 'ISOLATION', scene: 'studio' },
    ],
    stage: 'LIVE: in a club the drums and horns may already fill the room. Reinforce only what the audience lacks; close pickup gives the gain before feedback a distant view cannot; a separate balance for the stream.',
    studio: 'A RECORDING: ensemble-first if the players and the room set the balance — the main view, then one support for a specific line; or a more separated session with the neighbours audible enough to keep the cueing.',
  },
  diagnostic,
  practice: {
    task: 'With the players’ agreement, hear the group unamplified, agree its layout, set one main view, add one justified support at a time, check mono and stereo, and keep the PA, the wedges and the stream as separate roles — never provoking feedback. Log what you tried below.',
    fields: [
      { id: 'group', label: 'The group and its layout', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['studio', 'club', 'club and stream'] },
      { id: 'arch', label: 'The architecture: pair, supports, close, hybrid', kind: 'text' },
      { id: 'support', label: 'The support you added, its advantage and cost', kind: 'text' },
      { id: 'roles', label: 'What feeds the PA, the wedges, the stream', kind: 'text' },
      { id: 'notes', label: 'What you heard: balance, room, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every position on the stage plot is a drawing default: the grand on the audience’s left (its lid open toward them), the upright bass in the middle, the drums on the right turned toward the band, the soloist out front with a wedge 1.4 m ahead, the bassist’s wedge 1 m ahead.', dims: [] },
    { text: 'The main pair borrows the mixed-ensemble lesson’s suggested trial (1.5–3 m in front, 2–2.5 m up): the jazz lesson gives no distances. It is drawn 2 m in front and 2.2 m up.', dims: [] },
    { text: 'The close mics borrow their distances from the instrument lessons (bass 22 cm, the kick 8 cm outside, the sax 7.5 cm above the bell, the trumpet 40 cm, the piano 60 cm outside the curve, the amp 5 cm); the kit overhead 30 cm above a 1.3 m head.', dims: [] },
  ],
  live: { wedges: E15_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. A combo has no single right setup: hear the group, agree its layout with the players, choose one main view, and add a support only for a stated reason. The readouts on the stage plot are calculated from the drawing — equal source levels, straight paths, ideal patterns, no room — to compare setups, not to predict a club. Every group, room and production is different: experiment, compare at matched level, and trust your ears. Nothing fixed to a valuable instrument without the owner’s approval; protect your hearing; never provoke feedback.',
  copy: { words: ensembleWords('combo') },
  ensemble: {
    seatings: { quartet: 'jazz.quartet', guitar: 'jazz.guitar' },
    setups: E15_SETUPS,
    placeZones: E15_PLACE,
    worked: { quartet: 'pair', guitar: 'pair' },
    meet: {
      figureTitle: 'A JAZZ COMBO ON A CLUB STAGE',
      figureBadge: 'From above, as the audience sees it · a typical stage plot, not a particular group',
      sectionsNote: 'The grand on the audience’s left with its lid open toward them, the upright bass in the middle, the drums on the right, the sax out front. Switch SEATING for the guitar group with its amp turned away. Tap a player.',
      soundNote: 'The arcs show WHERE each sound leaves — never how loud. The bass at its bridge, the piano off its lid, the sax from its bell and holes, the kit from above: a main pair hears the conversation the room makes of them.',
      mainAt: MAIN_C,
    },
    before: [
      { title: 'LIST THE GROUP', text: 'The actual instruments, who leads each passage, how the players listen to one another, and where the monitors and loudspeakers will stand.' },
      { title: 'LISTEN', text: 'Unamplified, from a musically useful position: the brushes and the ride, the bass plucked and bowed, the piano lid, the horn’s movement, the amp’s level.' },
      { title: 'ASK THE PLAYERS', text: 'Eye contact, an open room, their normal formation, or a screen — and never let the layout get in the way of the performance.' },
      { title: 'TURN THE LOUDEST FIRST', text: 'Relocate or turn the loudest acoustic and amplified sources with the players’ agreement before adding a channel.' },
    ],
    safety: 'Stable stands; cable paths clear of the players, the audience, the piano pedals and the bass endpin. No mic in a horn bell or under a moving lid without clearance for the whole performance; no improvised clip or adhesive on a valuable instrument. Anything elevated is rigged by approved personnel. Protect your hearing; never sustain feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a combo: one main pair in front of the group and a little above — a place to start and compare, then add supports only for a named need.',
      clearance: 'The stand in front of the group, clear of the soloist’s movement, the wedges and the audience’s way; its cable dressed flat and out of the walkways.',
      height: 'About 2.2 m up — high enough to see past the soloist to the bass, the piano and the kit. Higher hears more of the back of the group and the room; lower, more of the soloist.',
      forward: 'About 2 m in front of the band’s front line. Closer tends to more of the soloist and more direct sound; farther back, more blend and more room — and, live, less gain before feedback.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin with the main pair — about 1.5–3 m in front of the group and 2–2.5 m up. Places to start and compare, not measurements of a best place.',
      'Change one thing at a time — distance, height, then the angle — and compare at a consistent level on the same chorus.',
      'If one player dominates, try the pair’s distance and height — or the players’ positions, with their agreement — before adding a support.',
    ],
    plot: true,
  },
};
