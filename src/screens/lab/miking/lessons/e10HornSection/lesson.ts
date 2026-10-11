/**
 * E10 BRASS, SAXOPHONE AND MIXED HORN SECTIONS — the lesson as DATA (the
 * 2026-10-07 journey). Words from the owner's lesson (docs/labs/miking/
 * source_text/Brass-Saxophone-and-Mixed-Horn-Sections-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/horn_section/ and the
 * Batch 3 wind lessons; corrections G5-E10-* in CORRECTIONS_LOG.md (the
 * unsourced "140 dB" becomes "about 130 dB close to the bell"; the "ring out"
 * line becomes the no-provocation rule). Suggested starting points; no
 * sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, POWER_REASON, SAFE_REASON } from '../shared/ensemble/ensembleItems.ts';
import { lab5Worksheet } from '../shared/ensemble/worksheet.ts';
import { E10_MODEL, E10_PLACE, E10_SEATS, E10_SETUPS, E10_WEDGES, E10_ZONES, LN_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a horn section — trumpet, saxophone, trombones, a tuba — on a stage and round one mic in a studio, and see where each instrument’s sound leaves it.',
    credit: { scenarios: ['hs.meet.1', 'hs.meet.2', 'hs.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Brass speaks from the bell and is strongly directional: on its axis brighter, off it softer. A saxophone speaks from its open tone holes as well as its bell, so a bell-only mic hears part of it. A section is several of these at once — and the players make the balance.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the section — a close mic on each player, one mic for two, a section pair in front, both together; in the studio, one mic or a pair at the centre of an arc. Then what to settle before any mic goes up.',
    credit: { scenarios: ['hs.set.1', 'hs.set.2', 'hs.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Hear the players first, at their loudest and softest. Minimal plans favour blend; expanded plans give control but act as one multi-mic system. Keep every stand clear of slides, bells, hands and feet.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare a close dynamic, a condenser at a distance and a section pair by what they do — and choose the pattern for the stage.',
    credit: { scenarios: ['hs.mic.1', 'hs.mic.2', 'hs.mic.3', 'hs.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'Choose by the job: a close dynamic for rejection and high level, a condenser at a distance for detail and the section’s blend, a pair for the picture. Check the loudest passage against each mic and preamp.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the section pair yourself — closer, farther, higher — and see what changes across the players.',
    credit: { scenarios: ['hs.place.1', 'hs.place.2', 'hs.31', 'hs.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the players, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Rehearse the balance before moving mics. Closer favours the nearest player; farther or higher evens the section out with more room. Move the pair as a unit, one change at a time.',
  },
  context: {
    title: 'Live sound and recording',
    goal: 'Turn a close mic so a floor monitor sits in its rejection — and decide what each mic feeds: the PA, the monitors, the recording.',
    credit: { scenarios: ['hs.ctx.1', 'hs.ctx.2', 'hs.ctx.studio', 'hs.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the trumpet mic (or change its pattern) until the monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'For the PA: close cardioids or supercardioids, wedges in the real rejection, only the level the players need. For a recording: the room and the section’s own balance. Never provoke feedback to find the limit.',
  },
  twoMic: {
    title: 'Close mics and the pair',
    goal: 'The section pair and the trumpet’s close mic: see how much earlier the close mic hears the trumpet, what polarity changes and what it does not, and judge the sum in mono.',
    credit: { scenarios: ['hs.two.0', 'hs.two.1', 'hs.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The relevant distance is the difference in paths from the player to each mic. Polarity changes the sign, never the time. Do not time-align the section to the pair by reflex: try level and placement first, and judge by ear.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement first: distance, angle off the bell, the sax’s body-and-bell view, the clipping stage, the monitor’s place in the pattern — before EQ. Lower the gain at the first sign of ringing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a section capture in order, choose and justify a setup for two briefs, and explain a section mic against close mics.',
    credit: { scenarios: ['hs.prac.order', 'hs.prac.gain', 'hs.prac.setup1', 'hs.prac.setup2', 'hs.prac.3', 'hs.mix.1', 'hs.mix.2', 'hs.mix.3'], note: 'Put the steps in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The worksheet is optional.' },
    takeaway: 'Hear the players, rehearse the balance, set gain on the loudest passage, start minimal, then expand only for a stated need — and check polarity, mono, spill and every player’s clearance.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L12–L13, L22 · set L14, L100 · mic L17, L39, L45–L66 · place L29 · ctx L39–L41 · two L31, L100 · prac L95–L100. */
const scenarios: MikingScenario[] = [
  {
    id: 'hs.meet.1',
    page: 'meet',
    prompt: 'Where does most of a trumpet’s bright edge travel?',
    options: ['Straight out along the bell’s axis', 'Out of the valves on the side of the horn', 'Back toward the player’s own face'],
    correct: 'Straight out along the bell’s axis',
    explain: 'Brass is strongly directional: on the bell’s axis the sound is brightest; off the axis, or farther away, the bite softens and the instrument’s fuller sound develops.',
    why: {
      'Out of the valves on the side of the horn': 'The valves make small mechanical sounds; the tone leaves through the bell.',
      'Back toward the player’s own face': 'The player hears it, but the bell points forward and carries the edge that way.',
    },
  },
  {
    id: 'hs.meet.2',
    page: 'meet',
    prompt: 'Why can a mic aimed only into a sax’s bell sound narrow?',
    options: ['Much of the sound leaves through the tone holes', 'A sax is far too quiet for a mic placed at the bell', 'The bell sends only the key noise out'],
    correct: 'Much of the sound leaves through the tone holes',
    explain: 'A saxophone radiates from its open tone holes along the body as well as from the bell. A position that sees both body and bell tends to sound more balanced.',
    why: {
      'A sax is far too quiet for a mic placed at the bell': 'Level is not the issue; the bell is only part of where the sound leaves.',
      'The bell sends only the key noise out': 'Key noise comes from the mechanism along the body; the bell carries tone too.',
    },
  },
  {
    id: 'hs.meet.3',
    page: 'meet',
    prompt: 'A tuba sits in the section. What does its sound need from a mic?',
    options: ['Distance and plenty of headroom', 'A mic pushed right into the upward bell', 'Nothing: the low notes reach no mic'],
    correct: 'Distance and plenty of headroom',
    explain: 'Low brass is powerful and its bell is large: too close, the low-mid builds up and mechanical noise shows. Start farther away than for a trumpet, with a robust mic, and check the loudest notes first.',
    why: {
      'A mic pushed right into the upward bell': 'Very close exaggerates the low-mid and risks overload.',
      'Nothing: the low notes reach no mic': 'They reach every mic on the stage — strongly.',
    },
  },
  {
    id: 'hs.set.1',
    page: 'setups',
    prompt: 'Before any stand goes up for the section, what do you ask?',
    options: ['The loudest, softest, highest and lowest passages', 'Which brand of mic the section usually prefers to use', 'How many spare inputs are left on the desk'],
    correct: 'The loudest, softest, highest and lowest passages',
    explain: 'Hear the player and the section first: the loudest and softest passages and the extremes of the range, from the audience or recording position. Mark each player’s movement and bell direction.',
    why: {
      'Which brand of mic the section usually prefers to use': 'A brand does not tell you where the sound goes or how loud it gets.',
      'How many spare inputs are left on the desk': 'Inputs are a later question; the music comes first.',
    },
  },
  {
    id: 'hs.set.2',
    page: 'setups',
    prompt: 'A close mic for the trombone is drawn on the stage. Where can it not go?',
    options: ['In the path of the moving slide', 'Above the slide, aimed across the bell', 'Beside the bell on the slide’s side'],
    correct: 'In the path of the moving slide',
    explain: 'The slide moves in and out through more than half a metre. A stand in its path is a collision hazard and a noise source: keep the mic above or beside it, clear at full extension.',
    why: {
      'Above the slide, aimed across the bell': 'That is a suggested start: clear of the slide at every position.',
      'Beside the bell on the slide’s side': 'Also fair, as long as the slide’s full travel stays clear.',
    },
  },
  hearingCheck('hs', 'setups', 'a horn section’s peaks'),
  {
    id: 'hs.mic.1',
    page: 'microphone',
    prompt: 'On a loud stage, which close mic tends to help the PA most?',
    options: ['A cardioid or supercardioid, close', 'An omni a metre away from the bell', 'A spaced pair well behind the section'],
    correct: 'A cardioid or supercardioid, close',
    explain: 'Close directional mics improve gain before feedback and reject more of the stage. A distant mic can sound fuller but gives the PA more room and monitor sound to amplify.',
    why: {
      'An omni a metre away from the bell': 'It hears the stage and the PA as much as the horn.',
      'A spaced pair well behind the section': 'Distant omnis are a recording view; on a loud stage they pick up the PA.',
    },
  },
  {
    id: 'hs.mic.2',
    page: 'microphone',
    prompt: 'Brass peaks close to a bell can exceed 140 dB SPL. So what?',
    options: ['Check the mic and preamp on the loudest passage', 'A dynamic copes anyway, so skip the check', 'Turn the trims up so the quiet parts show'],
    correct: 'Check the mic and preamp on the loudest passage',
    explain: 'Do not risk a delicate mic or preamp by guessing. Set gain on the loudest passage; engage a pad only where it sits before the stage that overloads.',
    why: {
      'A dynamic copes anyway, so skip the check': 'Dynamics vary, and the preamp can overload whatever the mic.',
      'Turn the trims up so the quiet parts show': 'The first loud passage would then overload.',
    },
  },
  {
    id: 'hs.mic.3',
    page: 'microphone',
    prompt: 'A clip-on mic on the sax: what does it trade for movement?',
    options: ['A close, smaller view, and cable to secure', 'Its pickup pattern changes when it is clipped', 'It gives the PA the least feedback margin'],
    correct: 'A close, smaller view, and cable to secure',
    explain: 'A clip keeps the distance steady as the player moves and improves separation, but hears a close perspective and handling noise. Audition its position and secure the cable from hands, keys and feet.',
    why: {
      'Its pickup pattern changes when it is clipped': 'The pattern is the mic’s own; the closeness changes the view.',
      'It gives the PA the least feedback margin': 'Close and steady, it usually helps the margin.',
    },
  },
  {
    id: 'hs.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The trumpet sounds harsh in its close mic. What do you change?',
    options: ['Move the mic a little off the bell’s axis', 'Swap the trumpet for a quieter instrument', 'Boost the treble so the edge cuts through'],
    correct: 'Move the mic a little off the bell’s axis',
    explain: 'On the bell’s axis the sound is brightest. A modest angle off the axis, or a little more distance, softens the edge before any EQ.',
    why: {
      'Swap the trumpet for a quieter instrument': 'The part is the part; change the mic’s view of it.',
      'Boost the treble so the edge cuts through': 'That makes the harshness worse.',
    },
  },
  {
    id: 'hs.place.1',
    page: 'placement',
    prompt: 'In the pair, the trumpet buries the tenor sax. What first?',
    options: ['Rehearse the balance; seat the trumpet farther back', 'Raise only the tenor sax with EQ on the mix bus', 'Move the whole pair right up close to the trumpet bell'],
    correct: 'Rehearse the balance; seat the trumpet farther back',
    explain: 'Ask the section to arrange itself musically: stronger instruments a little farther from the mic, weaker or darker ones closer, bells aimed consistently. Then move the pair if it still needs it.',
    why: {
      'Raise only the tenor sax with EQ on the mix bus': 'Bus EQ raises everyone in that range, the trumpet included.',
      'Move the whole pair right up close to the trumpet bell': 'That makes the trumpet louder still.',
    },
  },
  {
    id: 'hs.place.2',
    page: 'placement',
    prompt: 'You compare two pair positions. How do you judge them fairly?',
    options: ['The same passage, at matched loudness', 'Whichever position sounds louder at first', 'A different tune for each, for variety'],
    correct: 'The same passage, at matched loudness',
    explain: 'Compare at a consistent level on the same music, so louder never wins by itself, and change one thing at a time.',
    why: {
      'Whichever position sounds louder at first': 'Louder tends to sound better at first: an unfair test.',
      'A different tune for each, for variety': 'Different music changes the balance; compare like with like.',
    },
  },
  noThreeToOne('hs', 'placement'),
  {
    id: 'hs.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why might a pair hear the sax better than a bell-only close mic?',
    options: ['It hears both the tone holes and the bell', 'It is closer to the sax than the close mic', 'Pairs only hear woodwind instruments well'],
    correct: 'It hears both the tone holes and the bell',
    explain: 'From a little distance the pair hears the whole sax — body and bell — mixed in the room. A bell-only mic hears one part.',
    why: {
      'It is closer to the sax than the close mic': 'It is farther; its distance is what lets it hear the whole horn.',
      'Pairs only hear woodwind instruments well': 'A pair hears every instrument; the view is what differs.',
    },
  },
  {
    id: 'hs.ctx.1',
    page: 'context',
    prompt: 'You use supercardioids. Where do the wedges go?',
    options: ['Where its rejection really is, off the rear', 'Straight behind it, as for a cardioid', 'Anywhere, since supercardioids reject them'],
    correct: 'Where its rejection really is, off the rear',
    explain: 'A supercardioid’s least-sensitive directions sit off its rear axis, with a small lobe straight behind — not the same place as a cardioid’s rear null. Use the real polar diagram.',
    why: {
      'Straight behind it, as for a cardioid': 'Straight behind is where its rear lobe hears.',
      'Anywhere, since supercardioids reject them': 'They reject some directions only; the wedge has to sit there.',
    },
  },
  {
    id: 'hs.ctx.2',
    page: 'context',
    prompt: 'A digital stagebox feeds the PA and the recording. Who sets the gain?',
    options: ['Agreed in advance: one person controls it', 'Each engineer, whenever they need to', 'Nobody: a digital stagebox needs none'],
    correct: 'Agreed in advance: one person controls it',
    explain: 'A digital stagebox may share headamp gain and pads across every feed. Agree who controls gain and phantom power, follow the makers’ splitter and grounding instructions — and never lift a protective mains earth to cure hum.',
    why: {
      'Each engineer, whenever they need to': 'A shared gain change reaches every feed at once.',
      'Nobody: a digital stagebox needs none': 'Its preamps still need setting — once, by an agreed person.',
    },
  },
  {
    id: 'hs.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A good room, a section that balances itself. Where do you start?',
    options: ['A distant pair, then listen', 'A close mic on each player first', 'Gobos round each player first'],
    correct: 'A distant pair, then listen',
    explain: 'If the room is good and the section already balances, a distant pair may be the most natural choice. Isolation is a musical decision, not an automatic improvement.',
    why: {
      'A close mic on each player first': 'That gives control, but loses the blend you already have.',
      'Gobos round each player first': 'Screens are for overdubs or heavy editing; they can spoil sightlines.',
    },
  },
  {
    id: 'hs.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The trombone points its bell at a wedge. What happens?',
    options: ['The wedge and the trombone mic interact more', 'Nothing: brass is too loud to feed back', 'The wedge stops hearing the other players'],
    correct: 'The wedge and the trombone mic interact more',
    explain: 'Bells and slides move during playing. Place wedges with each mic’s rejection in mind and recheck as the players move.',
    why: {
      'Nothing: brass is too loud to feed back': 'Loud sources can still sit in a loop with a monitor.',
      'The wedge stops hearing the other players': 'A wedge plays; it does not hear.',
    },
  },
  {
    id: 'hs.two.0',
    page: 'twoMic',
    prompt: 'The pair is 1.4 m from the trumpet; its close mic 0.4 m. What follows?',
    options: ['The close mic hears it about 3 ms earlier', 'Both mics hear the trumpet at the same time', 'The pair hears the trumpet a little earlier'],
    correct: 'The close mic hears it about 3 ms earlier',
    explain: 'A 1 m path difference is about 2.9 ms. Summed, the early close mic can change the attack and colour — compare pair alone, close mic alone and both.',
    why: {
      'Both mics hear the trumpet at the same time': 'Different distances mean different arrival times.',
      'The pair hears the trumpet a little earlier': 'The close mic is nearer, so it hears the trumpet first.',
    },
  },
  {
    id: 'hs.two.1',
    page: 'twoMic',
    prompt: 'What does flipping the close mic’s polarity change?',
    options: ['The sign, never the arrival time', 'The arrival time, by half a period', 'Nothing a listener can hear at all'],
    correct: 'The sign, never the arrival time',
    explain: 'Polarity inversion changes the sign; it does not correct an arrival-time difference. It only tests one relationship — judge both states by ear.',
    why: {
      'The arrival time, by half a period': 'The time difference stays; only the sign changes.',
      'Nothing a listener can hear at all': 'With two mics summed, the sign can change the sound a lot.',
    },
  },
  {
    id: 'hs.two.2',
    page: 'twoMic',
    prompt: 'Should you time-align every close mic to the section pair?',
    options: ['Only as a trial: level and placement first', 'Align each one to the pair’s nearest capsule', 'Set one delay for all from the stage plan'],
    correct: 'Only as a trial: level and placement first',
    explain: 'Players move and the room adds its own arrivals: one delay cannot suit them all. Lower or move the close mic first; any delay is a trial judged by ear, on several notes.',
    why: {
      'Align each one to the pair’s nearest capsule': 'That ignores the movement, the room and the other players.',
      'Set one delay for all from the stage plan': 'Distance alone sets no universal delay.',
    },
  },
  {
    id: 'hs.prac.gain',
    page: 'practice',
    prompt: 'How do you set conservative gain for the section?',
    options: ['On the loudest passage, with headroom', 'On the softest ballad, then add a little', 'On the tuning note, before the band plays'],
    correct: 'On the loudest passage, with headroom',
    explain: 'Record a conservative level during the loudest passage; check the quiet parts too. Mark the placement so a retake can reproduce the sound.',
    why: {
      'On the softest ballad, then add a little': 'The first loud chord would then overload.',
      'On the tuning note, before the band plays': 'One quiet note says nothing about the peaks.',
    },
  },
  {
    id: 'hs.prac.3',
    page: 'practice',
    prompt: 'When is one section mic the better plan than a mic on each player?',
    options: ['When blend matters and the section balances', 'When the PA must be as loud as it can be', 'When each player needs separate editing later'],
    correct: 'When blend matters and the section balances',
    explain: 'A minimal plan favours blend and reduces phase and feedback complexity. Close mics give control for the PA, cueing and later balance — at the cost of more leakage paths and stand clutter.',
    why: {
      'When the PA must be as loud as it can be': 'Loud reinforcement usually needs close, directional mics.',
      'When each player needs separate editing later': 'Separate editing needs separate close mics.',
    },
  },
  { ...ortfFixed('hs', 'practice'), id: 'hs.mix.1' },
  { ...msMono('hs', 'practice'), id: 'hs.mix.2' },
  {
    id: 'hs.mix.3',
    page: 'practice',
    prompt: 'The close mics and the pair together sound comb-filtered. First?',
    options: ['Mute in turn, in mono; lower or move one', 'Add the same EQ curve to each close mic', 'Delay the pair until it matches the trumpet'],
    correct: 'Mute in turn, in mono; lower or move one',
    explain: 'Treat the expanded plan as one system: mute and unmute each source in mono, and confirm the pair adds useful information rather than coloration.',
    why: {
      'Add the same EQ curve to each close mic': 'EQ cannot fill a comb notch made by two arrivals.',
      'Delay the pair until it matches the trumpet': 'One delay suits one player at most; the others still comb.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'hs.s.bright',
    observation: 'The trumpet or trombone is painfully bright',
    firstChecks: 'Too close or on the axis? Move back, angle off the axis, lower the gain before EQ, then reassess.',
    options: ['Move back or off the axis; lower gain', 'Cut the treble hard and push the fader', 'Ask the player to point at the floor'],
    correct: 'Move back or off the axis; lower gain',
    explain: 'On the bell’s axis and close, the bite is strongest. A little distance or angle softens it before any EQ.',
    why: { 'Cut the treble hard and push the fader': 'EQ after a poor angle dulls everything else too.', 'Ask the player to point at the floor': 'The player’s playing stays theirs; move the mic.' },
  },
  {
    id: 'hs.s.hollow',
    observation: 'The saxophone sounds hollow or all midrange',
    firstChecks: 'Does the mic hear mostly the bell? Move it beside the bell and body, or to a balanced view of both.',
    options: ['See the body and bell; move it beside them', 'Push the mic right into the bell for more', 'Boost the low end until it sounds full'],
    correct: 'See the body and bell; move it beside them',
    explain: 'A bell-only view misses the tone holes. A position that sees both body and bell sounds more balanced.',
    why: { 'Push the mic right into the bell for more': 'Deeper into the bell hears even less of the body.', 'Boost the low end until it sounds full': 'EQ cannot add the tone holes the mic does not hear.' },
  },
  {
    id: 'hs.s.blend',
    observation: 'The horn section lacks blend',
    firstChecks: 'Inconsistent distances, or each close mic a different colour? Rehearse the balance, align the placement logic, compare a section mic with the close mics.',
    options: ['Rehearse; align distances and placement', 'Add reverb to the brass until it blends', 'Pan the four players hard left and right'],
    correct: 'Rehearse; align distances and placement',
    explain: 'Blend starts with the players and consistent placement logic; compare a section view with the close mics.',
    why: { 'Add reverb to the brass until it blends': 'Reverb hides the problem; the distances still differ.', 'Pan the four players hard left and right': 'Panning spreads them; it does not blend them.' },
  },
  {
    id: 'hs.s.fb',
    observation: 'Feedback begins when the monitors come up',
    firstChecks: 'Is a mic aimed at a monitor, or too far for the gain needed? Lower that send at once; move the wedge into the pattern’s rejection, work closer, lower the stage level.',
    options: ['Lower the send; fix the wedge and distance', 'Push it until it rings, then back off a bit', 'Turn the mics toward the monitors instead'],
    correct: 'Lower the send; fix the wedge and distance',
    explain: 'Bring levels up only to what the players need. At any ring, lower that send immediately and fix the geometry — never provoke feedback to find the limit.',
    why: { 'Push it until it rings, then back off a bit': 'Never work by provoking feedback.', 'Turn the mics toward the monitors instead': 'That points their most sensitive side at the loop.' },
  },
  {
    id: 'hs.s.mud',
    observation: 'The low brass is muddy',
    firstChecks: 'Too close, too much proximity or room build-up? Increase the distance or change the angle; a measured high-pass or low-mid cut only after placement.',
    options: ['More distance or angle; EQ only after', 'Move the mic right into the bell’s mouth', 'Turn up the tuba so it cuts through'],
    correct: 'More distance or angle; EQ only after',
    explain: 'Low brass needs distance and headroom; too close exaggerates the low-mid. Placement first, a measured filter after.',
    why: { 'Move the mic right into the bell’s mouth': 'Closer adds more proximity build-up.', 'Turn up the tuba so it cuts through': 'Louder mud is still mud.' },
  },
  {
    id: 'hs.s.clip',
    observation: 'The level clips unexpectedly',
    firstChecks: 'A close peak past the mic’s or preamp’s headroom? Engage the right pad, lower the preamp gain, retest the loudest passage.',
    options: ['Right pad, lower gain, retest the peak', 'Lower the channel fader until it stops', 'Move the clip mic down into the bell'],
    correct: 'Right pad, lower gain, retest the peak',
    explain: 'A pad helps only before the stage that clips; a later fader cannot repair overload upstream.',
    why: { 'Lower the channel fader until it stops': 'The fader comes after the overload.', 'Move the clip mic down into the bell': 'Closer means louder, and more overload.' },
  },
  {
    id: 'hs.s.noise',
    observation: 'Key, valve or stand noise is intrusive',
    firstChecks: 'Too close to the mechanism, or coupled through the stand? Move a few centimetres or change the angle, add shock isolation, service the clip — keeping safe clearance.',
    options: ['Move or angle it; isolate the mount', 'Gate the mic so it opens on notes only', 'Ask the player to press the keys gently'],
    correct: 'Move or angle it; isolate the mount',
    explain: 'Mechanical noise is placement and coupling: a small move, a different angle or a shock mount fixes it at the source.',
    why: { 'Gate the mic so it opens on notes only': 'The noise happens during the notes too.', 'Ask the player to press the keys gently': 'The player plays as they play; move the mic.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'hs.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A studio recording of a four-piece section (trumpet, tenor sax, trombone, tuba) in a good room, with independent balance wanted later. Phantom power on every input.',
    setups: [
      { id: 'a', label: 'The players on an arc round an X/Y pair, plus a close mic on each', ok: true, power: 'phantom', feedback: 'The blend from the pair and separate tracks for later balance.' },
      { id: 'b', label: 'One section mic at the arc’s centre, the players balancing themselves', ok: true, power: 'phantom', feedback: 'Fair for blend — independent balance will be limited.' },
      { id: 'c', label: 'A clip in each bell and no section view', ok: false, power: 'phantom', feedback: 'A bell-only, close view of every player and no room.' },
      { id: 'd', label: 'A stand mic in the trombone’s slide path, on its axis', ok: false, power: 'phantom', feedback: 'A collision hazard and noise source in the slide’s travel.' },
      { id: 'e', label: 'One omni a metre from the trumpet only', ok: false, power: 'phantom', feedback: 'The trumpet dominates; the others are off in the distance.' },
    ],
    reasons: [
      { id: 'r.bal', label: 'The players set the balance first', role: 'required', feedback: 'Say why: the mics capture the section’s balance; they do not create it.' },
      SAFE_REASON,
      POWER_REASON,
      BRAND_REASON,
      { id: 'r.eq', label: 'EQ can fix the balance later', role: 'wrong', feedback: 'EQ cannot repair avoidable placement problems.' },
    ],
    explain: 'More than one setup passes. What passes is the reasoning: the players’ balance first, a clear section view, safe stands.',
  },
  {
    id: 'hs.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: the horn line is reinforced and recorded for a stream. Wedges in front of the players.',
    setups: [
      { id: 'a', label: 'A close cardioid on each player, wedges in each mic’s rejection', ok: true, power: 'none', feedback: 'Gain before feedback and control; the wedges sit where the mics hear least.' },
      { id: 'b', label: 'Close mics for the PA, a section pair only for the stream', ok: true, power: 'phantom', feedback: 'Roles kept apart: the pair stays out of the PA and the wedges.' },
      { id: 'c', label: 'A spaced omni pair 3 m out, sent to the PA', ok: false, power: 'phantom', feedback: 'A distant pair in the PA hears the PA and the stage.' },
      { id: 'd', label: 'Raise the wedges until they ring, then back off', ok: false, power: 'none', feedback: 'Never provoke feedback; bring them up to what the players need.' },
      { id: 'e', label: 'Cables slack across the players’ feet, to save time', ok: false, power: 'none', feedback: 'Cable slack must not catch a hand, slide, chair or foot.' },
    ],
    reasons: [
      { id: 'r.pa', label: 'Close directional mics give the PA more margin', role: 'required', feedback: 'Say why: closer and directional means more of the horn, less of the stage.' },
      SAFE_REASON,
      { id: 'r.roles', label: 'Each mic has a role: PA, stream, or both', role: 'optional', feedback: 'A fair reason: the stream pair need not feed the PA.' },
      BRAND_REASON,
      { id: 'r.dist', label: 'A distant pair sounds fullest in the PA', role: 'wrong', feedback: 'Fuller, but it also hears the PA and the monitors.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: close directional mics, wedges in the real rejection, clear roles, safe cables.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of what is behind the trumpet mic?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the pair from 1.8 m to 2.2 m. What changes most?', options: ['The four players even out', 'Only the level', 'The nearest player dominates more'], after: 'Higher, the distances to the nearest and farthest players even out: the NEAR / FAR readout shrinks. Compare at matched level.' },
  context: { prompt: 'The wedge sits in front of the trumpet, on the floor. Can the close mic’s rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The pair and the trumpet’s close mic. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'hs.q.1',
    covers: 'meet',
    prompt: 'Where does a saxophone’s sound leave it?',
    options: ['The open tone holes and the bell', 'Only the bell, just as a trumpet does', 'The mouthpiece and the neck'],
    correct: 'The open tone holes and the bell',
    explain: 'A sax radiates from its open tone holes along the body as well as from the bell.',
    why: { 'Only the bell, just as a trumpet does': 'The bell is only part of the sax’s sound.', 'The mouthpiece and the neck': 'The reed starts the sound; it leaves through the holes and the bell.' },
  },
  {
    id: 'hs.q.2',
    covers: 'meet',
    prompt: 'What happens to a trumpet’s tone just off its bell’s axis?',
    options: ['The bright edge softens', 'It gets brighter and louder', 'Nothing changes off the axis'],
    correct: 'The bright edge softens',
    explain: 'On the axis is brightest; a modest angle off it softens the upper harmonics.',
    why: { 'It gets brighter and louder': 'That is what the axis does.', 'Nothing changes off the axis': 'Brass is strongly directional; the angle matters a lot.' },
  },
  {
    id: 'hs.q.3',
    covers: 'meet',
    prompt: 'Why does low brass need more distance than a trumpet?',
    options: ['Low-mid build-up and big peaks', 'It is too quiet to mic closely', 'Its bell faces the floor'],
    correct: 'Low-mid build-up and big peaks',
    explain: 'Too close, a tuba or euphonium exaggerates the low-mid and mechanical noise; its peaks need headroom.',
    why: { 'It is too quiet to mic closely': 'It is loud; the closeness is the problem.', 'Its bell faces the floor': 'A tuba’s bell usually points up.' },
  },
  {
    id: 'hs.q.4',
    covers: 'setups',
    prompt: 'For one section mic in the studio, where do the players sit?',
    options: ['About the same distance from it', 'As close to it as each one can get', 'In a straight row behind it'],
    correct: 'About the same distance from it',
    explain: 'Arrange the players at about an equal distance from the section mic, stronger ones a little farther back if needed.',
    why: { 'As close to it as each one can get': 'Crowding it favours whoever is nearest.', 'In a straight row behind it': 'Behind the mic is where it hears least.' },
  },
  {
    id: 'hs.q.5',
    covers: 'setups',
    prompt: 'Close mics on all four players: how do you treat them?',
    options: ['As one system, checked in mono', 'As four separate recordings', 'As spares, faded up as needed'],
    correct: 'As one system, checked in mono',
    explain: 'Each mic hears its neighbours too: solo and mute each in mono, and confirm the section pair adds something.',
    why: { 'As four separate recordings': 'Each one also hears the others.', 'As spares, faded up as needed': 'Open mics change the sum even when you are not using them.' },
  },
  {
    id: 'hs.q.safe',
    covers: 'setups',
    critical: true,
    prompt: 'Setting a close mic on a trombone during rehearsal. What comes first?',
    options: ['The slide’s full travel stays clear', 'The mic’s best angle, whatever it takes', 'The player moves to suit the stand'],
    correct: 'The slide’s full travel stays clear',
    explain: 'Clearance first: the slide at full extension, the bell, the hands and the player’s way in and out. Keep your ears off the bells’ axes while you work.',
    why: { 'The mic’s best angle, whatever it takes': 'No angle is worth a collision with the slide or the player.', 'The player moves to suit the stand': 'The player plays as they play; the stand moves.' },
  },
];

export const E10_LESSON: EnsembleLesson = {
  id: 'E10',
  labId: 'ensembles',
  title: 'Horn Sections',
  subtitle: 'Brass and saxes together: one section view, a mic for two, or a close mic on each — the players make the balance',
  noun: { one: 'horn section', many: 'horn sections' },
  model: E10_MODEL,
  micTypeIds: ['instDynCard', 'saxDynSuper', 'sdcCard', 'lbRibbon', 'arrCard', 'arrOmni', 'arrFig8'],
  zones: E10_ZONES,
  setupPairs: [
    { label: 'The section pair and a close trumpet mic', A: { zone: 'ln.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'ln.tpt', typeId: 'instDynCard', pattern: 'cardioid' }, variants: ['line'], line: 'The blend from the pair, the trumpet’s detail from its own mic; check the sum in mono.' },
    { label: 'The section pair and a close trumpet mic', A: { zone: 'arc.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'arc.tpt', typeId: 'instDynCard', pattern: 'cardioid' }, variants: ['arc'], line: 'The arc’s blend with one player’s detail; check the sum in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'hs.prac.order',
      page: 'practice',
      prompt: 'A section capture, in order:',
      steps: [
        { text: 'Hear the loudest, softest, highest and lowest passages', early: 'Start with the players and the music.' },
        { text: 'Mark each player’s movement and bell direction', early: 'Know where the bells and slides go before any stand.' },
        { text: 'Set conservative gain on the loudest passage', early: 'Gain comes once the mics are safely placed.' },
        { text: 'Make a minimal capture: one section mic or pair', early: 'The minimal plan comes before the expanded one.' },
        { text: 'Expand with close mics only for a stated need; check mono', early: 'Close mics come after the section view, for a reason.' },
      ],
      explain: 'Hear the section, map the movement and the bells, set conservative gain, capture minimally — and only then expand, checking polarity, mono and spill.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Trumpet, flugelhorn, trombone, French horn, tuba or euphonium and the saxophones — and the mixed horn sections they make together.', src: 'LESSON-HORNS' },
    { title: 'WHAT IT ASKS OF YOU', text: 'A coherent section image, with individual control where the job needs it: tone, bleed, headroom, phase, feedback margin and the players’ movement all checked.', src: 'LESSON-HORNS' },
    { title: 'HOW IT IS SET OUT', text: 'On stage, a line of standing players; in a studio, the players can sit round one mic at about the same distance. The players arrange themselves for the balance.', src: 'S-SM4-UG' },
    { title: 'ITS SIZE', text: 'This line is about 3 m wide; the studio arc about 2.5 m across. Typical layouts drawn here, not particular sections.', src: 'LESSON-HORNS' },
  ],
  sound: {
    stages: [
      { title: 'Brass from the bell', text: 'Trumpet and trombone send their sound out of the bell, strongly directional: brightest on its axis, softer off it and farther away.' },
      { title: 'The sax from its whole body', text: 'A saxophone radiates from its open tone holes along the body and from the bell; the larger the sax, the more distance one mic needs to hear it all.' },
      { title: 'Low brass, big and low', text: 'A tuba’s bell points up and its low notes are powerful: distance and headroom, and a shared mic can give a more coherent low-brass sound.' },
    ],
    attack: 'Tonguing and valve or key attacks reach a close mic first and clearest; a section mic hears them softened by distance and the room.',
    body: 'The section’s sustained sound blended in the room. A section mic hears the blend; a close mic, one player — with its neighbours behind it. Tendencies, not guarantees.',
    head: { diameterMm: 3000, rods: 0, label: 'a horn section', strikeSrc: 'LESSON-HORNS' },
  },
  setting: {
    items: [
      { id: 'players', label: 'the slides, bells, hands and feet', short: 'PLAYERS', note: 'Full slide clearance at every position; the bell’s travel; stands and cables clear of hands, chairs and feet. Keep ears off the bells’ axes.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'Keep ears away from bell axes … preserve full slide and player clearance (L100)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'neigh', label: 'the next player’s bell', short: 'NEIGHBOUR', note: 'Every close mic hears the players beside it too: a trumpet next to a sax mic arrives off its axis, and in the sum.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'It also increases leakage differences (L31)' }, tag: 'SPILL', scene: 'all' },
      { id: 'mutes', label: 'mutes and doubles', short: 'MUTES', note: 'A mute changes the tone and the direction; a double (flugelhorn, flute) may need its own position. Mark them in the plan.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'Flugelhorn generally has a darker, broader character than trumpet (L18)' }, tag: 'CHANGES', scene: 'all' },
      { id: 'mon', label: 'the wedges', short: 'MONITORS', note: 'Each wedge in its mic’s real rejection — a supercardioid’s is off its rear, not straight behind. Only the level the players need.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'Put wedges in the appropriate rejection region of the chosen microphone (L39)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'split', label: 'the split', short: 'SPLIT', note: 'A digital stagebox may share gain and pads across every feed: agree who sets them, and take an unprocessed feed for the recording.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'a digital stagebox may share headamp gain and pads (L41)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'room', label: 'the room and isolation', short: 'ROOM', note: 'In a good room a distant pair may be the most natural choice; gobos only when the production needs separate tracks, with sightlines kept.', prov: { kind: 'sourced', src: 'LESSON-HORNS', quote: 'If the room is good and the section already balances, a distant pair may be the most natural choice (L36)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: enough level and clarity without changing the players’ own balance or creating feedback. Close cardioids or supercardioids, wedges in the real rejection, cables secured from slides and feet; a wireless clip needs coordinated frequencies, fresh batteries and a wired fallback.',
    studio: 'A RECORDING: the players in the arrangement they will perform. A minimal section view first; close mics where later editing needs them, treated as one system. Mark every placement so a retake matches.',
  },
  diagnostic,
  practice: {
    task: 'Set up a four-player section (trumpet, trombone, an alto or tenor sax, one low brass). Make a minimal capture, then an expanded one; compare the bell axis, off the axis and the sax’s body-and-bell view at matched level; place the wedges in the rejection for live work, or compare the section view with isolated tracks in the studio. With the players’ agreement, log what you tried below.',
    fields: lab5Worksheet({ seating: E10_SEATS.line, noun: 'section' }),
  },
  unknowns: [
    { text: 'The horn line is a drawing default: four players standing 1 m apart, 0.5 m behind the front line. The studio arc is a drawing default: four seated players, each instrument’s bell (the sax’s body) 1.5 m from the section mic (inside the 1–6 ft range).', dims: [] },
    { text: 'The close mics’ directions are drawing defaults: the trumpet’s 15° off the bell’s axis; the sax’s beside the bell on the player’s right, a little above; the trombones’ above and beside the slide; the tuba’s about 61 cm above its bell.', dims: [] },
    { text: 'The section pair is drawn 1.4 m in front and 2 m up on stage, at the arc’s centre 1.3 m up in the studio; the wedge 1.8 m in front of the trumpet.', dims: [] },
  ],
  live: { wedges: E10_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. A horn section has no single right setup: hear the players, rehearse the balance, start with a minimal plan and expand only for a stated need. Every section, room and production is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical layouts, ideal patterns, straight paths and distances read from the drawing. Brass peaks close to a bell can exceed 140 dB SPL: protect the mics, the preamps and your hearing.',
  copy: { words: ensembleWords('horn section') },
  ensemble: {
    seatings: { line: 'horns.line', arc: 'horns.arc' },
    setups: E10_SETUPS,
    placeZones: E10_PLACE,
    worked: { line: 'lnPair', arc: 'arcXY' },
    meet: {
      figureTitle: 'A HORN LINE',
      figureBadge: 'From above, as the audience faces it · a typical layout, not a particular section',
      sectionsNote: 'Trumpet, alto sax, trombone and bass trombone standing in a line. Switch SEATING for the studio arc with a tenor sax and a tuba. Tap a player.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. Brass from the bell, straight ahead; the sax from its body and bell; the tuba straight up.',
      mainAt: LN_C,
    },
    before: [
      { title: 'HEAR THE SECTION', text: 'The loudest passage, the softest, the highest and the lowest — from where the audience or the recording will hear it.' },
      { title: 'MARK THE MOVEMENT', text: 'Each player’s bell direction and movement, every slide at full extension, mutes and doubles.' },
      { title: 'LET THE PLAYERS BALANCE', text: 'Stronger instruments a little farther from a section mic, weaker or darker ones closer, bells aimed consistently — before moving any mic.' },
      { title: 'CHOOSE MINIMAL OR EXPANDED', text: 'One section mic or pair favours blend; a close mic on each player gives control but acts as one multi-mic system.' },
    ],
    safety: 'Stable stand bases; full slide and player clearance; cables secured from hands, chairs and feet. Keep your ears off the bells’ axes and use hearing protection when the exposure warrants it. Brass peaks close to a bell can exceed 140 dB SPL. Never lift a protective mains earth to cure hum; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin with a horn section: one section pair in front of the players, a little above, before any close mic — a place to start and compare, not a rule.',
      clearance: 'The stand in front of the line, clear of the slides at full extension and of the players’ way in and out; its cable dressed flat and out of the walkways.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin with the section pair — on stage about 1.2–1.8 m in front and a little above; in the studio at the arc’s centre, about 1.5 m from every player. Places to start and compare, not a best place.',
      'Change one variable at a time — distance, height, then the angle — and compare at matched level on the same passage.',
      'The players set the section’s balance; the pair captures it. Move the whole pair; a different spacing or angle is a different method.',
    ],
  },
};
