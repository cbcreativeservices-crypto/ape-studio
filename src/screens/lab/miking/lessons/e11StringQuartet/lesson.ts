/**
 * E11 STRING QUARTETS AND LARGER STRING SECTIONS — the lesson as DATA (the
 * 2026-10-07 journey). Words from the owner's lesson (docs/labs/miking/
 * source_text/String-Quartets-and-Larger-String-Sections-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/string_section/,
 * full_orchestra/SOURCES.md §A and the bowed family (Lab 4); corrections
 * E11-* in CORRECTIONS_LOG.md (the stale cross-reference names both
 * ensemble lessons). Suggested starting points; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { abHole, BRAND_REASON, ensembleWords, hearingCheck, msMono, noThreeToOne, ortfFixed, PAIR_REASON, POWER_REASON, riggingDiag, SAFE_REASON, SPOTS_REASON, supportFirst, supportNeed } from '../shared/ensemble/ensembleItems.ts';
import { E11_MODEL, E11_PLACE, E11_SETUPS, E11_WEDGES, E11_ZONES, Q_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet the string quartet in brief — two violins, viola and cello, and the larger sections they grow into — and see where each instrument’s sound leaves it.',
    credit: { scenarios: ['sq.meet.1', 'sq.meet.2', 'sq.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Bowed strings are large, complex sources: the body, the strings and the bow together, with the room. A mic close in hears a part; a little farther away it hears the instrument whole and the quartet blended.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn on the stage — an X/Y, a 17 cm and a spaced pair in front of the quartet, one support, four close mics; for larger sections, a pair over the podium and section supports. Then what to settle before any mic goes up.',
    credit: { scenarios: ['sq.set.1', 'sq.set.2', 'sq.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Seat the group as the players prefer; hear their range of playing before any equipment changes. Start with a central pair in front of and above them; supports come after, one at a time.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Compare X/Y, the 17 cm pair, a spaced pair and M/S for a quartet — and choose a spot or a close mic by its pattern and its mount.',
    credit: { scenarios: ['sq.mic.1', 'sq.ortf', 'sq.ms', 'sq.mic.2', 'sq.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'Use quiet, low-noise mics with a suitable response for the main pair. The angle between the axes is not the recording angle; keep each method’s geometry and move the whole array.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and move the main pair yourself — height and distance separately — and see how the cello, the first violin and the inner voices change.',
    credit: { scenarios: ['sq.place.1', 'sq.place.2', 'sq.31', 'sq.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the players, in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Closer tends to more direct sound but favours the front players; farther back, more room and less clarity. Change height and distance separately, at matched level.',
  },
  context: {
    title: 'Quiet hall or loud stage',
    goal: 'Turn the cello spot so a monitor sits in its rejection — and adapt the plan for a quiet hall and a loud band stage.',
    credit: { scenarios: ['sq.ctx.1', 'sq.ctx.2', 'sq.ctx.studio', 'sq.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the cello spot (or change its pattern) until the monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A quiet hall may need little or no reinforcement; a band stage may need close directional mics. Move loud sources away from the strings, place wedges by the real polar diagram, and keep the recording mix apart from the PA.',
  },
  twoMic: {
    title: 'Main pair and a spot',
    goal: 'The main pair and the cello spot: see how much earlier the spot hears the cello, what polarity does and does not change, and judge the sum in mono.',
    credit: { scenarios: ['sq.first', 'sq.two.1', 'sq.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'A spot’s delay is the difference in path from the player, divided by the speed of sound — one source’s estimate, not a section’s. Lowering or moving the spot often beats aligning everything electronically.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each observation to the first checks and the adjustment to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven observations (a retry is explained, never penalised).' },
    takeaway: 'Placement and the players first: the pair’s distance, angle and spacing, the spots’ level, the room, the monitors — before EQ. Stop and refit any mount that touches a bow.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a quartet setup in order, choose and justify a setup for two briefs, and say when a support earns its place.',
    credit: { scenarios: ['sq.prac.order', 'sq.prac.gain', 'sq.prac.setup1', 'sq.prac.setup2', 'sq.prac.3', 'sq.hole', 'sq.need', 'sq.first2'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Sketch the seating, hear the range of playing, build a main pair and change one thing at a time, add one support for a stated line, and keep bow, cable and stand clearances.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L7–L9 · set L8–L9 · mic L11–L34 · place L9, L32 · ctx L47–L52 · two L53–L55 · prac L85–L92. */
const scenarios: MikingScenario[] = [
  {
    id: 'sq.meet.1',
    page: 'meet',
    prompt: 'Where does a violin’s sound leave the instrument?',
    options: ['The whole body, driven by the strings', 'Only the two f-holes, and nowhere else', 'Only the scroll at the far end'],
    correct: 'The whole body, driven by the strings',
    explain: 'The whole body radiates, driven by the strings and the bow’s contact: a complex, extended source. A close mic hears the part nearest it; a little distance hears it whole.',
    why: {
      'Only the two f-holes, and nowhere else': 'The f-holes are one part; the top and back plates radiate too.',
      'Only the scroll at the far end': 'The scroll is the tuning end; the body does the radiating.',
    },
  },
  {
    id: 'sq.meet.2',
    page: 'meet',
    prompt: 'Why can a close mic favour attack over the blended sound?',
    options: ['It is near the bow and one part of the body', 'Close mics are tuned for the higher pitches', 'The players play harder for the close mics'],
    correct: 'It is near the bow and one part of the body',
    explain: 'Close in, the bow’s contact and the nearest part of the body dominate: attack and separation, at the expense of the blended perspective.',
    why: {
      'Close mics are tuned for the higher pitches': 'Distance changes what the mic hears, not a tuning.',
      'The players play harder for the close mics': 'The playing is the same; the mic’s view changes.',
    },
  },
  {
    id: 'sq.meet.3',
    page: 'meet',
    prompt: 'A promising listening spot sounds great to you. What next?',
    options: ['Check it through the actual mics', 'Mark it as the right place for the pair', 'Put the mics exactly at your ear height'],
    correct: 'Check it through the actual mics',
    explain: 'A mic does not have human selective attention: a promising listening position still has to be verified through the actual microphones.',
    why: {
      'Mark it as the right place for the pair': 'A good seat is not proof of a good mic position.',
      'Put the mics exactly at your ear height': 'The mics hear without your attention; listen through them.',
    },
  },
  {
    id: 'sq.set.1',
    page: 'setups',
    prompt: 'Before any equipment, what do you ask the quartet for?',
    options: ['Their range: soft, accents, pizzicato, lows', 'A single loud chord to set the input gain', 'To sit in a straight line facing the mics'],
    correct: 'Their range: soft, accents, pizzicato, lows',
    explain: 'Sustained soft notes, a strong accent, pizzicato, low cello notes and passages where the inner voices matter — and tremolo, harmonics or mutes if used. Note the balance before changing anything.',
    why: {
      'A single loud chord to set the input gain': 'One chord shows one moment; you need the whole range.',
      'To sit in a straight line facing the mics': 'Seat them as they prefer: eye contact comes first.',
    },
  },
  {
    id: 'sq.set.2',
    page: 'setups',
    prompt: 'A clip mic on a violin. What do you check before playing?',
    options: ['The bow’s sweep, cable slack, the player’s OK', 'Only that the clip holds tight on the rib', 'That it sits right on top of the bridge itself'],
    correct: 'The bow’s sweep, cable slack, the player’s OK',
    explain: 'Use a mount made for the instrument, with the player’s approval: check the full bow sweep, the left hand’s travel, chair movement and cable slack. No adhesive on varnish, no cable pulling on the instrument.',
    why: {
      'Only that the clip holds tight on the rib': 'Tight is not enough: the bow, the hand and the cable must stay clear.',
      'That it sits right on top of the bridge itself': 'Never on the bridge: the mount stays off the bridge and the varnish.',
    },
  },
  hearingCheck('sq', 'setups', 'a loud band stage'),
  {
    id: 'sq.mic.1',
    page: 'microphone',
    prompt: 'Which main pair has the least time difference between its sides?',
    options: ['A coincident X/Y pair', 'A 17 cm, 110° cardioid pair', 'A spaced omni pair'],
    correct: 'A coincident X/Y pair',
    explain: 'With the capsules together, every player reaches both mics at once: a clear image with little time difference — and a dependable mono sum.',
    why: {
      'A 17 cm, 110° cardioid pair': '17 cm of spacing adds a small time difference to the level cue.',
      'A spaced omni pair': 'Spacing is its main cue: time differences between the sides.',
    },
  },
  ortfFixed('sq', 'microphone'),
  msMono('sq', 'microphone'),
  {
    id: 'sq.mic.2',
    page: 'microphone',
    prompt: 'How do the 17 cm pair’s 110° axes relate to its recording angle?',
    options: ['They differ: 110° apart, 95° to fill', 'They match: both angles are the same 110°', 'They match once it faces the group'],
    correct: 'They differ: 110° apart, 95° to fill',
    explain: 'The capsules are 110° apart; the recording angle — how wide the group should appear from the pair — is 95°. Move the pair to put the quartet inside it.',
    why: {
      'They match: both angles are the same 110°': 'The axes’ angle and the recording angle are different things.',
      'They match once it faces the group': 'Aiming moves the coverage; it does not change the two angles.',
    },
  },
  {
    id: 'sq.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why might a mic close to a cello sound boomy?',
    options: ['Proximity and the f-hole’s local resonance', 'The cello plays louder near a microphone', 'Close mics hear only the higher strings well'],
    correct: 'Proximity and the f-hole’s local resonance',
    explain: 'Close in, a directional mic adds proximity effect and favours local body resonances — an f-hole especially. Broaden the pickup before any low cut.',
    why: {
      'The cello plays louder near a microphone': 'The cello does not change; the mic’s view does.',
      'Close mics hear only the higher strings well': 'A close mic hears plenty of low end — often too much.',
    },
  },
  {
    id: 'sq.place.1',
    page: 'placement',
    prompt: 'The first violin dominates the pair. First change?',
    options: ['Move or angle the pair; rebalance', 'Add a spot on the second violin', 'Ask the first violin to play less'],
    correct: 'Move or angle the pair; rebalance',
    explain: 'Check the pair’s distance, angle and the seating first: move it to even the players, or rebalance with them — before any spot.',
    why: {
      'Add a spot on the second violin': 'A spot adds overlap; the pair’s placement is the cause.',
      'Ask the first violin to play less': 'The players’ balance is musical; start with the pair’s position.',
    },
  },
  {
    id: 'sq.place.2',
    page: 'placement',
    prompt: 'You move the pair closer to the quartet. What tends to change?',
    options: ['More direct sound; the front players favoured', 'More room and a softer, blended attack', 'Nothing at all until the pair turns to face them'],
    correct: 'More direct sound; the front players favoured',
    explain: 'Closer generally increases direct sound but may privilege the front players; farther back exposes more room and can reduce clarity.',
    why: {
      'More room and a softer, blended attack': 'That is what moving back tends to do.',
      'Nothing at all until the pair turns to face them': 'Distance alone changes the balance and the room.',
    },
  },
  noThreeToOne('sq', 'placement'),
  {
    id: 'sq.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why does a little distance help a bowed string?',
    options: ['It hears the whole body, not one part', 'It removes the room from the sound', 'It cuts the bow’s attack off completely'],
    correct: 'It hears the whole body, not one part',
    explain: 'A bowed string radiates from its whole body; a little distance lets the mic hear the instrument whole, with the room.',
    why: {
      'It removes the room from the sound': 'Distance adds room; it does not remove it.',
      'It cuts the bow’s attack off completely': 'The attack is still there, in proportion with the body.',
    },
  },
  {
    id: 'sq.ctx.1',
    page: 'context',
    prompt: 'A quartet with a loud band. What helps the strings most?',
    options: ['Move amps and drums away; close mics', 'Turn the band down, keep the pair', 'Push the pair up until the strings cut through'],
    correct: 'Move amps and drums away; close mics',
    explain: 'Move loud amplifiers, drums and loudspeaker coverage away from the strings where you can; individual directional close mics give a usable margin before feedback EQ.',
    why: {
      'Turn the band down, keep the pair': 'A distant pair on a loud stage hears the band and the PA.',
      'Push the pair up until the strings cut through': 'More gain on a distant pair invites feedback.',
    },
  },
  {
    id: 'sq.ctx.2',
    page: 'context',
    prompt: 'A clip mic stays put on the violin as the player moves. What still changes?',
    options: ['Its angle to the monitors', 'Its distance to the violin', 'The violin’s own sound'],
    correct: 'Its angle to the monitors',
    explain: 'A clip keeps its distance to the instrument, but its orientation to the monitors changes as the player moves — recheck the wedges with the player in position.',
    why: {
      'Its distance to the violin': 'The clip keeps that distance fixed.',
      'The violin’s own sound': 'The instrument is the same; the mic’s relation to the monitors moves.',
    },
  },
  {
    id: 'sq.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A quartet recording in a quiet room. Where do you start?',
    options: ['A main pair alone, then listen', 'A close mic on each player first', 'Room mics first, the pair last'],
    correct: 'A main pair alone, then listen',
    explain: 'Build the sound with the pair before adding spots; compare positions at a similar level; keep the room’s decay if it serves the music.',
    why: {
      'A close mic on each player first': 'Close mics are for production control or a loud stage, not the first step.',
      'Room mics first, the pair last': 'The room is judged against the pair’s picture.',
    },
  },
  {
    id: 'sq.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A cardioid spot on the cello: where does it reject most?',
    options: ['Straight behind it', 'At its two sides, 90° off', 'Directly in front'],
    correct: 'Straight behind it',
    explain: 'A cardioid rejects most directly behind; a super- or hypercardioid has a rear lobe and nulls off the rear axis. Place the monitor by the real mic’s polar diagram.',
    why: {
      'At its two sides, 90° off': 'At its sides a cardioid is about half as sensitive, not at its least.',
      'Directly in front': 'In front is where it is most sensitive.',
    },
  },
  supportFirst('sq', 'twoMic'),
  {
    id: 'sq.two.1',
    page: 'twoMic',
    prompt: 'The spot is 1 m nearer the cello than the pair. About how much earlier?',
    options: ['About 2.9 ms', 'About 29 ms', 'About 0.3 ms'],
    correct: 'About 2.9 ms',
    explain: 'Sound travels about 343 m a second: 1 m takes about 2.9 ms. That is one source’s estimate — several players, reflections and movement change it.',
    why: {
      'About 29 ms': 'That would be about 10 m of path difference.',
      'About 0.3 ms': 'That would be about 10 cm of path difference.',
    },
  },
  {
    id: 'sq.two.2',
    page: 'twoMic',
    prompt: 'The spots make the quartet hollow. What do you try first?',
    options: ['Lower or move the spots, then compare', 'Flip each spot’s polarity, then listen again', 'Delay each spot by its distance'],
    correct: 'Lower or move the spots, then compare',
    explain: 'Overlap, level and arrival times hollow the sum: lower the spots, move them, and test timing only in context — compared with the plain version.',
    why: {
      'Flip each spot’s polarity, then listen again': 'Polarity cannot remove a frequency-dependent delay relationship.',
      'Delay each spot by its distance': 'One distance suits one player at best; level and placement first.',
    },
  },
  {
    id: 'sq.prac.gain',
    page: 'practice',
    prompt: 'Which passage sets a quartet’s input gain?',
    options: ['The strongest accents and loud passages', 'The softest harmonics in the whole piece', 'Tuning, before the players warm up'],
    correct: 'The strongest accents and loud passages',
    explain: 'Set gain on the strongest ensemble accents, with headroom; then check the softest passages for noise.',
    why: {
      'The softest harmonics in the whole piece': 'The first accent would then overload.',
      'Tuning, before the players warm up': 'Tuning says nothing about the music’s peaks.',
    },
  },
  {
    id: 'sq.prac.3',
    page: 'practice',
    prompt: 'When does a viola or cello spot earn its place?',
    options: ['When a line needs support the pair lacks', 'At each concert, as a matter of routine and habit', 'When the cellist asks for more level'],
    correct: 'When a line needs support the pair lacks',
    explain: 'Add a spot only when a musical line needs support: begin muted, raise it until the line is clearer without pulling it out of the group.',
    why: {
      'At each concert, as a matter of routine and habit': 'A spot must earn its place with a stated need.',
      'When the cellist asks for more level': 'That is a monitoring request; the recording balance is a separate question.',
    },
  },
  abHole('sq', 'practice'),
  supportNeed('sq', 'practice', 'a quiet line'),
  { ...supportFirst('sq', 'practice'), id: 'sq.first2', prompt: 'A bass support sits 5 m closer to the basses than the main pair. What follows?' },
];

const symptoms: Symptom[] = [
  {
    id: 'sq.s.lead',
    observation: 'The lead violin dominates',
    firstChecks: 'The array’s distance, angle and the seating. Move the main array or rebalance with the players.',
    options: ['Move the array or rebalance with players', 'Spot the other three players up high to match', 'Cut the violin’s range with EQ'],
    correct: 'Move the array or rebalance with players',
    explain: 'The pair’s position decides who is nearest; move it, or rebalance with the players, before any spot.',
    why: { 'Spot the other three players up high to match': 'Three loud spots add overlap; fix the pair first.', 'Cut the violin’s range with EQ': 'EQ cuts the others in that range too.' },
  },
  {
    id: 'sq.s.inner',
    observation: 'The viola or cello vanishes',
    firstChecks: 'The main coverage and the arrangement. Reposition first; add a low-level support if needed.',
    options: ['Reposition first; then a low support', 'Raise the whole mix until it appears', 'Pan that player to the centre'],
    correct: 'Reposition first; then a low support',
    explain: 'Coverage first: move the pair so all four are in view; then, if a line still needs it, a low-level support.',
    why: { 'Raise the whole mix until it appears': 'Raising everything keeps the others on top.', 'Pan that player to the centre': 'Panning moves it; it does not uncover it.' },
  },
  {
    id: 'sq.s.scratch',
    observation: 'Bow scratch dominates',
    firstChecks: 'A local close perspective. Move or angle the mic and compare at matched level.',
    options: ['Move or angle the mic; compare', 'Low-pass all of the strings hard', 'Ask the player for less bow pressure'],
    correct: 'Move or angle the mic; compare',
    explain: 'A mic too close to the bow’s contact hears the scratch: move it or angle it away, then compare at matched level.',
    why: { 'Low-pass all of the strings hard': 'A low-pass dulls the whole instrument.', 'Ask the player for less bow pressure': 'The playing is the player’s; the mic’s view is yours to change.' },
  },
  {
    id: 'sq.s.boom',
    observation: 'The cello sounds boomy',
    firstChecks: 'F-hole emphasis, proximity, room modes. Broaden the pickup before applying a low cut.',
    options: ['Broaden the pickup before a low cut', 'Move the spot right into the f-hole', 'Boost the highs to balance it out'],
    correct: 'Broaden the pickup before a low cut',
    explain: 'A spot aimed at an f-hole, close, adds proximity and a local resonance: broaden its view first.',
    why: { 'Move the spot right into the f-hole': 'Closer to the f-hole adds more of the boom.', 'Boost the highs to balance it out': 'That adds harshness; the low build-up is still there.' },
  },
  {
    id: 'sq.s.centre',
    observation: 'The centre becomes weak',
    firstChecks: 'A/B spacing and panning. Reduce the spacing or audition another array.',
    options: ['Reduce spacing or try another array', 'Pan the pair even wider to compensate', 'Raise the cello spot to fill it'],
    correct: 'Reduce spacing or try another array',
    explain: 'A spaced pair too wide thins the middle: narrow it, or compare a coincident or near-coincident pair.',
    why: { 'Pan the pair even wider to compensate': 'Wider panning deepens the hole.', 'Raise the cello spot to fill it': 'A spot fills one player, not the image.' },
  },
  {
    id: 'sq.s.fb',
    observation: 'Feedback as the players move',
    firstChecks: 'Monitor geometry and stage level. Lower the sends and correct placement before further EQ.',
    options: ['Lower the sends; correct the placement', 'Turn the monitors up loud enough to cover it', 'Ask the players to stop moving'],
    correct: 'Lower the sends; correct the placement',
    explain: 'Lower the sends at once; place the wedges by the real polar diagram with the players in position.',
    why: { 'Turn the monitors up loud enough to cover it': 'Louder monitors make feedback likelier.', 'Ask the players to stop moving': 'Players move; the setup must allow it.' },
  },
  {
    id: 'sq.s.bow',
    observation: 'A clip or cable hits the bow',
    firstChecks: 'The mount and the cable route. Stop, refit with the player, and repeat the movement checks.',
    options: ['Stop; refit with the player; recheck', 'Tape the cable to the instrument', 'Ask the player to bow more gently from now on'],
    correct: 'Stop; refit with the player; recheck',
    explain: 'Stop, refit the mount and dress the cable with the player, and repeat the full movement checks.',
    why: { 'Tape the cable to the instrument': 'Never tape to varnish; reroute and refit.', 'Ask the player to bow more gently from now on': 'The setup must leave the bow clear.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'sq.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quartet recording in a quiet hall. Phantom power on every input; the players are seated as they like.',
    setups: [
      { id: 'a', label: 'An X/Y pair about 1.5 m in front and 2.1 m up, aimed across all four', ok: true, power: 'phantom', feedback: 'The quartet and the room as one picture, a dependable mono sum.' },
      { id: 'b', label: 'A 17 cm, 110° pair in the same place, plus a cello spot at low level', ok: true, power: 'phantom', feedback: 'Fair: one main pair and one support for a stated line.' },
      { id: 'c', label: 'Four clip mics on the instruments and no pair', ok: false, power: 'phantom', feedback: 'Control for a loud stage, not a hall recording’s blend.' },
      { id: 'd', label: 'A spaced pair 2 m apart, right at the players’ chairs', ok: false, power: 'phantom', feedback: 'Too wide and too close: a hole in the middle, the nearest player on top.' },
      { id: 'e', label: 'Re-seat the quartet in a straight line for the pair', ok: false, power: 'phantom', feedback: 'Seat them as they prefer; the mics adapt.' },
    ],
    reasons: [PAIR_REASON, SAFE_REASON, POWER_REASON, BRAND_REASON, SPOTS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a main pair first, the players’ seating kept, supports only for a stated line.',
  },
  {
    id: 'sq.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · The quartet plays with a loud band on a festival stage, with a PA and wedges.',
    setups: [
      { id: 'a', label: 'A close mic on each player, amps moved away, wedges in the mics’ rejection', ok: true, power: 'phantom', feedback: 'Close pickup, loud sources moved off, monitors placed by the pattern.' },
      { id: 'b', label: 'Instrument-mounted mics fitted with the players, cables dressed clear of the bows', ok: true, power: 'phantom', feedback: 'Fair: stable distance as they move — recheck the monitors with them in place.' },
      { id: 'c', label: 'A distant pair for the PA, turned up until the strings cut', ok: false, power: 'phantom', feedback: 'A distant pair on a loud stage feeds back first.' },
      { id: 'd', label: 'Clip mics taped to the varnish', ok: false, power: 'phantom', feedback: 'Never adhesive on varnish; use a mount made for the instrument.' },
      { id: 'e', label: 'Ring the system out loudly before the show', ok: false, power: 'phantom', feedback: 'Never provoke feedback; check gain at conservative levels.' },
    ],
    reasons: [{ id: 'r.close', label: 'Close directional pickup for the loud stage', role: 'required', feedback: 'Say why: the strings against a loud band need closeness.' }, SAFE_REASON, POWER_REASON, BRAND_REASON, { id: 'r.pair', label: 'A distant pair gives the most natural PA sound', role: 'wrong', feedback: 'Natural for a recording, but a distant pair on a loud stage is the first to feed back.' }],
    explain: 'Two setups pass. What passes is the reasoning: close pickup, loud sources away, monitors by the pattern, and the bows left clear.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern hears the most of the room around a quartet?', options: ['Omni', 'Cardioid', 'Figure-8'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 1 m to 2 m in front. What changes most?', options: ['More room, the players evened out', 'Only the level', 'The first violin dominates more'], after: 'Farther back, the distances to the four players even out: the NEAR / FAR readout shrinks, and the room comes up. Compare at matched level.' },
  context: { prompt: 'The monitor sits in front of the cello spot. Can its rejection reach it?', options: ['Yes — turn the mic’s back toward it', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'A main pair and a cello spot. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to another player.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'sq.q.1',
    covers: 'meet',
    prompt: 'What is a bowed string, as a sound source?',
    options: ['A large, complex radiating body', 'A small point at the bridge', 'A sound that leaves from the scroll end'],
    correct: 'A large, complex radiating body',
    explain: 'The body radiates in a complex way, driven by the strings and the bow: a mic’s view of it changes with position.',
    why: { 'A small point at the bridge': 'The bridge drives the body; the body radiates.', 'A sound that leaves from the scroll end': 'The scroll is the tuning end; the body radiates.' },
  },
  {
    id: 'sq.q.2',
    covers: 'meet',
    prompt: 'In the quartet as drawn, who sits where the audience’s left is?',
    options: ['The first violin', 'The cello player', 'The viola player'],
    correct: 'The first violin',
    explain: 'This lab draws the first violin on the left, then the second violin, with the viola and cello on the right — orders vary by group.',
    why: { 'The cello player': 'The cello is on the right in both drawn orders.', 'The viola player': 'The viola sits right of centre or on the right.' },
  },
  {
    id: 'sq.q.3',
    covers: 'meet',
    prompt: 'Why verify a good listening spot through the mics?',
    options: ['A mic hears without your attention', 'Mics simply hear less than ears', 'The players move about while you listen'],
    correct: 'A mic hears without your attention',
    explain: 'Your ears pick out what you attend to; a mic does not. Check the spot through the actual microphones.',
    why: { 'Mics simply hear less than ears': 'They hear differently — without selective attention — not simply less.', 'The players move about while you listen': 'The players stay; the difference is the mic’s lack of attention.' },
  },
  {
    id: 'sq.q.4',
    covers: 'setups',
    prompt: 'Where might a quartet’s main pair start?',
    options: ['In front and above, 1–2 m out', 'Among the players, at chair height', 'Behind the quartet, near the wall'],
    correct: 'In front and above, 1–2 m out',
    explain: 'In front of and above the group, about 1–2 m out and 1.8–2.5 m up — a trial to start from, with a view across all four.',
    why: { 'Among the players, at chair height': 'It would block them and hear the nearest one.', 'Behind the quartet, near the wall': 'Behind them it hears their backs and the wall.' },
  },
  {
    id: 'sq.q.5',
    covers: 'setups',
    prompt: 'For larger string sections, what do support mics cover?',
    options: ['Sections of three or four players', 'Each desk, with one mic per music stand', 'Only the first chair of each of them'],
    correct: 'Sections of three or four players',
    explain: 'Supports cover musical sections — around 1–1.5 m from players, three or four of them in one example — not every desk by default.',
    why: { 'Each desk, with one mic per music stand': 'One per desk is not needed by default.', 'Only the first chair of each of them': 'A soloist mic is for a featured line; supports cover sections.' },
  },
  riggingDiag('sq'),
];

export const E11_LESSON: EnsembleLesson = {
  id: 'E11',
  labId: 'ensembles',
  title: 'String Quartet and Sections',
  subtitle: 'A pair in front of the quartet, one support if needed — then the larger string sections',
  noun: { one: 'string quartet', many: 'string quartets' },
  model: E11_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8'],
  zones: E11_ZONES,
  setupPairs: [
    { label: 'The main pair and a cello spot', A: { zone: 'q.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'q.vc', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['quartet'], line: 'A line supported under the pair; check the sum in mono.' },
    { label: 'The main pair and a cello spot', A: { zone: 'q.main', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'q.vc2', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['quartetVa'], line: 'A line supported under the pair; check the sum in mono.' },
    { label: 'The main pair and a viola support', A: { zone: 's.main', typeId: 'arrOmni', pattern: 'omni' }, B: { zone: 's.va', typeId: 'arrCard', pattern: 'cardioid' }, variants: ['sections'], line: 'An inner voice supported under the pair; check the sum in mono.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'sq.prac.order',
      page: 'practice',
      prompt: 'A quartet recording setup, in order:',
      steps: [
        { text: 'Sketch the seating, loudspeakers, paths and stands', early: 'Start with the plan: where everyone sits and where things go.' },
        { text: 'Hear the range of playing; approve clearances with them', early: 'Hear them and agree clearances before any mic goes up.' },
        { text: 'Build an X/Y or 17 cm main pair', early: 'The main pair comes before any comparison or support.' },
        { text: 'Change height, then distance, one at a time', early: 'Adjust once the pair is up and you have a first picture.' },
        { text: 'Add one support only if a line needs it', early: 'A support comes last, for a stated line.' },
      ],
      explain: 'Plan, hear the players and agree clearances, build the pair, change one thing at a time — and only then a support for a stated line.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Two violins, a viola and a cello playing as one ensemble — and, larger, the violin, viola, cello and double-bass sections of a string orchestra.', src: 'LESSON-QUARTET' },
    { title: 'THE CENTRAL CHOICE', text: 'Capture the group blending in the room, or separate sources for reinforcement and production control. Neither is best everywhere.', src: 'LESSON-QUARTET' },
    { title: 'HOW IT IS SEATED', text: 'As the players and musical director prefer, keeping eye contact. This lab draws an arc with the first violin on the left; the viola and cello swap places in some groups.', src: 'LESSON-QUARTET' },
    { title: 'ITS SIZE', text: 'The quartet’s arc is about 2.5 m across; the string sections, about 8 m. Typical layouts, not particular groups.', src: 'LESSON-QUARTET' },
  ],
  sound: {
    stages: [
      { title: 'The whole body radiates', text: 'Each instrument radiates from its body, driven by its strings and the bow’s contact — a complex, extended source.' },
      { title: 'Position changes the mix', text: 'Close in, the bow and the nearest part of the body; farther away, the whole instrument with the room.' },
      { title: 'The room blends them', text: 'Reflections join the four into one sound — the perspective a main pair hears.' },
    ],
    attack: 'The bow’s start and pizzicato reach a close mic first and clearest; a main pair hears them in proportion with the body and the room.',
    body: 'The sustained sound of the bodies blended in the room. A main pair hears the blend; a spot, more of one player and its bow. Tendencies — groups and rooms vary.',
    head: { diameterMm: 2600, rods: 0, label: 'a string quartet', strikeSrc: 'LESSON-QUARTET' },
  },
  setting: {
    items: [
      { id: 'bows', label: 'the bows’ sweep and the players’ movement', short: 'BOWS', note: 'Check the full bow sweep, the left hand’s travel, chair movement, the cello’s endpin and the cable slack before anything is final.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Check the full bow sweep, left-hand travel, chair movement, cello endpin and cable slack (L50)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'eyes', label: 'the players’ eye contact', short: 'SIGHTLINES', note: 'Seat the group as the players prefer; preserve eye contact and the conductor’s view. Stands go where nobody needs to see.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Preserve eye contact and conductor visibility (L8)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'varnish', label: 'the instruments’ varnish and bridges', short: 'INSTRUMENTS', note: 'No adhesive on varnish, nothing on the bridge, no cable pulling on the instrument; mounts made for it, with the player’s approval.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Do not use ordinary adhesive on varnish or let a cable pull on the instrument (L50)' }, tag: 'HANDS OFF', scene: 'all' },
      { id: 'band', label: 'loud amps, drums and loudspeakers', short: 'LOUD STAGE', note: 'On a band stage, move loud amplifiers, drums and loudspeaker coverage away from the strings where you can.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Move loud amplifiers, drums and loudspeaker coverage away from the strings where feasible (L48)' }, tag: 'SPILL', scene: 'stage' },
      { id: 'wedges', label: 'the wedges', short: 'MONITORS', note: 'Place wedges by the real mic’s polar diagram, with the player in position — a null at a loud source does not guarantee silence.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Place wedges using the actual microphone’s polar diagram (L49)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'room', label: 'the room’s decay', short: 'THE ROOM', note: 'Keep the room’s decay if it serves the music; move the group or the pair if reflections smear entrances.', prov: { kind: 'sourced', src: 'LESSON-QUARTET', quote: 'Preserve the room decay if it serves the music (L37)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: first decide how much reinforcement the audience needs — a quiet hall may need little or none, a band stage close directional mics. Keep a separate recording mix where the system allows; mono PA coverage may serve the audience better than hard-panned sections.',
    studio: 'A RECORDING: a quiet room and low-noise mics; build the sound with the pair; compare positions at a similar level; a spot only when a line needs it.',
  },
  diagnostic,
  practice: {
    task: 'Sketch the seating, hear the range of playing and agree clearances, build a main pair and change one thing at a time, add one support only for a stated line, and adapt for a quiet hall or a loud stage without provoking feedback. With the players’ agreement, log what you tried below.',
    fields: [
      { id: 'seat', label: 'The seating and the room', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'quiet hall', 'band stage'] },
      { id: 'pair', label: 'Main pair: method, height, distance', kind: 'text' },
      { id: 'support', label: 'Any support, and the line it served', kind: 'text' },
      { id: 'clear', label: 'Bow, cable and stand clearances checked', kind: 'text' },
      { id: 'notes', label: 'What you heard: inner voices, cello, room, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The quartet order (1st violin, 2nd violin, viola, cello, or the viola and cello swapped) is a drawing default: no source read gives a standard order. The arc (1.3 m round a point 1 m in front) is a drawing default.', dims: [] },
    { text: 'The quartet pair is drawn 1.5 m in front and 2.1 m up (inside the lesson’s 1–2 m and 1.8–2.5 m trial). The cello spot is drawn 0.9 m out (inside the cello lesson’s 0.6–1.2 m); the close mics 30 cm out (inside the violin and cello lessons’ 25–35 cm).', dims: [] },
    { text: 'The string sections are the Full Orchestra lesson’s strings (10-8-6-6-4, drawing defaults); the supports 1.25 m from four players (inside 1–1.5 m).', dims: [] },
  ],
  live: { wedges: E11_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. A quartet has no single right setup: seat the players as they like, start with a pair in front of and above them, change height and distance one at a time, and add a support only for a line that needs it. Every group, room and stage is different: experiment, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: typical seatings, ideal patterns, straight paths and distances read from the drawing. Mounts only with the players’ approval and never on varnish; protect your hearing; never provoke feedback.',
  copy: { words: ensembleWords('string quartet') },
  ensemble: {
    seatings: { quartet: 'quartet.arc', quartetVa: 'quartet.arcVa', sections: 'strings.american' },
    setups: E11_SETUPS,
    placeZones: E11_PLACE,
    worked: { quartet: 'xy', quartetVa: 'xy', sections: 'sab' },
    meet: {
      figureTitle: 'STRING QUARTET',
      figureBadge: 'From above, as the audience faces it · a typical layout, not a particular group',
      sectionsNote: 'Four players on an arc, facing each other and the hall: 1st violin, 2nd violin, viola, cello — switch SEATING to swap the viola and cello, or for the larger sections. Tap a player.',
      soundNote: 'The arcs show WHERE each instrument’s sound leaves it — never how loud. Each body radiates up and out with its strings and bow; the room blends the four into the sound a main pair hears.',
      mainAt: Q_C,
    },
    before: [
      { title: 'SEAT THEM AS THEY LIKE', text: 'Preserve the players’ eye contact and the conductor’s view; the mics adapt to the seating, not the other way round.' },
      { title: 'HEAR THE RANGE', text: 'Soft sustained notes, a strong accent, pizzicato, low cello notes, inner-voice passages — and tremolo, harmonics or mutes if used. Note the balance first.' },
      { title: 'DECIDE WHAT IT IS FOR', text: 'The quartet blending in the room, or separate sources for reinforcement and production control — neither is best everywhere.' },
      { title: 'CLEARANCES', text: 'The bow’s sweep, the left hand, the chair, the cello’s endpin and the cable slack — checked with the players, before anything is final.' },
    ],
    safety: 'Mounts only with the player’s approval: never on the bridge or the varnish, no cable pulling on the instrument, every bow sweep left clear. Stands stable and clear of the players’ movement; anything over the players is the venue’s rigging. Protect your hearing; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we suggest you begin with a quartet: a central pair in front of and above the group, with a view across all four — a trial to start from, not a published best place.',
      clearance: 'The stand in front of the quartet, clear of the bows’ sweep, the cello’s endpin and the players’ sightlines; its cable dressed flat and out of the way.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we suggest you begin with the main pair’s centre — for a quartet, 1–2 m in front and 1.8–2.5 m up; for larger sections, over or just behind the podium, 3–4 m up.',
      'Change height and distance separately, checking the cello’s definition, the first violin’s dominance, the inner voices and the room’s decay at each step.',
      'Keep the pair’s own geometry as you move it: changing the 17 cm pair’s spacing makes a different near-coincident pair.',
    ],
  },
};
