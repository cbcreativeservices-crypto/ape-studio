/**
 * M10 DRUM ROOM MICROPHONES — the lesson's pages as DATA (blueprint §7). The
 * words come from the owner's lesson (docs/labs/miking/source_text/M10-Drum-
 * Room-Microphones-Miking-Technique.txt, "L<n>" in COMMENTS only) with the
 * fixes in docs/labs/miking/CORRECTIONS_LOG.md (R-01 …) applied. Owner ruling
 * 2026-10-04: starting points, never dogma; no source, brand, model or
 * person's name and no badge in learner text.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { CYMBAL_DRAWING_DEFAULTS } from '../shared/cymbals/cymbalSpec.ts';
import { DRUM_DRAWING_DEFAULTS } from '../shared/drums/drumSpec.ts';
import { M10_MODEL, M10_WEDGES } from './geometry.ts';
import { M10_ZONES } from './model.ts';
import { M10_COPY } from './copy.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the room mics',
    goal: 'Get to know what a room mic is for and what it hears — the kit after its parts have blended, and the room answering — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A room mic hears the kit after its parts have begun to blend, plus the room’s answer. No distance is a room mic by itself, and a room feed is optional.',
  },
  sound: {
    title: 'How the room answers',
    goal: 'See when the kit reaches points near and far, and how the floor, the walls and the ceiling send it back. Shown, never played.',
    credit: { scenarios: ['rm.snd.1', 'rm.snd.2', 'rm.snd.3'], interactive: 'soundPath', note: 'On step 2, drag TIME past the last reflection, and answer the three checks.' },
    takeaway: 'Every part of the kit reaches a room mic late — about 3 ms per metre — and the room’s reflections follow it. Farther out, the room’s share grows.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the room around the kit — walls, floor, ceiling, corners, the door and its walkway — and what a stage adds.',
    credit: { scenarios: ['rm.set.1', 'rm.set.2', 'rm.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Listen to the kit and the room first, decide what a room feed is for — maybe none — and keep stands off the walls and out of exits and walkways.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose a room mic by its properties — pattern, power, how it is addressed and mounted — for the question you are asking.',
    credit: { scenarios: ['rm.mic.1', 'rm.mic.2', 'rm.mic.3', 'rm.mic.4', 'rm.rec.1'], note: 'Answer the five checks (one reaches back to how the room sounds).' },
    takeaway: 'An omni hears the room from every side; a directional mic favours the kit in front of it. A side-address mic is aimed with its face. A condenser is common, not compulsory.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — measured from the kick’s front head, facing the kit, clear of exits and walkways — then move the mic and compare.',
    credit: { scenarios: ['rm.place.1', 'rm.place.2', 'rm.place.3', 'rm.rec.2'], interactive: 'twoZones', note: 'Rest a mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'A room-mic starting point is a place to begin and to compare from — not a standard distance. Change one thing at a time, and compare at the same listening level.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a room mic so its pattern’s rejection faces the PA — and know where a room feed belongs on a show.',
    credit: { scenarios: ['rm.ctx.1', 'rm.ctx.2', 'rm.ctx.studio', 'rm.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the room mic (or change its pattern) until the PA sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Live, a distant room mic hears the PA and the monitors and costs gain before feedback: it usually feeds a recording or broadcast, kept out of the PA and the monitors. Real nulls are shallow, and the room returns sound from every side.',
  },
  twoMic: {
    title: 'Room and kit together',
    goal: 'See how late a room mic hears the kit compared with a mic over it — and why that delay is the point, not a fault to remove.',
    credit: { scenarios: ['rm.two.1', 'rm.two.2', 'rm.two.3', 'rm.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'A room mic is late by the extra distance — that delay, and the room after it, is what it adds. Polarity does not remove it; aligning it automatically changes what made it worth having.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each heard result to its likely cause and the first experiment to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic, compare positions at the same level, check mono — or leave the room feed out — before reaching for EQ.',
  },
  practice: {
    title: 'Practice',
    goal: 'Run a room-mic comparison in the right order, choose and justify a room setup for two briefs, and say when a room feed earns its channel.',
    credit: { scenarios: ['rm.prac.order', 'rm.prac.gain', 'rm.prac.setup1', 'rm.prac.setup2', 'rm.prac.3', 'rm.mix.1', 'rm.mix.2', 'rm.mix.3'], note: 'Put the comparison in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real room.' },
    takeaway: 'A safe, repeatable position, one change at a time at the same level, a mono check with the other mics and a clear routing decision pass — and leaving the room mic out can pass too.',
  },
};

/* Source lines in comments only: rm.snd.* L3, L42, L64-L65 · rm.set.* L5, L70-L71 ·
 * rm.mic.* L11-L24 · rm.place.* L6, L30-L42 · rm.ctx.* L66-L68 · rm.two.* L64-L65 ·
 * rm.prac.* L71-L79. */
const scenarios: MikingScenario[] = [
  {
    id: 'rm.snd.1',
    page: 'sound',
    prompt: 'A room mic is 5 m from the snare; an overhead is 1 m from it. Roughly how much later does the room mic hear the snare?',
    options: ['About 12 ms later', 'About 1 ms later', 'At the same moment'],
    correct: 'About 12 ms later',
    explain: 'Sound travels about 34 cm per millisecond at 20 °C: 4 m farther is about 12 ms later. That delay is part of what a room mic brings.',
    why: {
      'About 1 ms later': 'One millisecond is about 34 cm. Four metres farther is about twelve times that.',
      'At the same moment': 'Both mics hear the same stroke, but the farther one hears it later — set by the extra distance.',
    },
  },
  {
    id: 'rm.snd.2',
    page: 'sound',
    prompt: 'After the snare’s direct sound reaches a room mic, what arrives next?',
    options: ['Its echoes from the nearest surfaces, then the rest', 'Nothing more: a room mic hears just one arrival per stroke', 'The kick, because low sounds are slower'],
    correct: 'Its echoes from the nearest surfaces, then the rest',
    explain: 'The floor, the walls and the ceiling each send the sound back — the nearest first. After many bounces they blend into the decay.',
    why: {
      'Nothing more: a room mic hears just one arrival per stroke': 'Every surface sends the sound back: the room’s reflections follow the direct sound.',
      'The kick, because low sounds are slower': 'All pitches travel at the same speed. What arrives next is the room’s answer to the stroke.',
    },
  },
  {
    id: 'rm.snd.3',
    page: 'sound',
    prompt: 'You move a room mic farther from the kit. What happens to the balance of kit and room?',
    options: ['The room’s share tends to grow', 'The kit’s share tends to grow', 'The balance stays where it was'],
    correct: 'The room’s share tends to grow',
    explain: 'The direct sound falls about 6 dB each time the distance doubles, while the room’s reverberant sound stays roughly even — so farther out, the room takes over. Whether that helps depends on the room.',
    why: {
      'The kit’s share tends to grow': 'Farther from the kit, its direct sound weakens: the room’s share grows, not the kit’s.',
      'The balance stays where it was': 'Distance changes the direct sound much more than the room’s answer, so the balance moves.',
    },
  },
  {
    id: 'rm.set.1',
    page: 'setting',
    prompt: 'The best-sounding spot is right against a side wall. How do you mount the mic there?',
    options: ['On a floor stand, clear of the wall and the walkway', 'Taped to the wall itself, so the stand is out of the way', 'Hung from the ceiling grid, if a cable tie will reach'],
    correct: 'On a floor stand, clear of the wall and the walkway',
    explain: 'Floor stands only, clear of exits, walkways, cases and players. Fixing a mic to a wall, the ceiling or a grid is for the venue to approve, with qualified people.',
    why: {
      'Taped to the wall itself, so the stand is out of the way': 'Nothing is fixed to a wall without the venue’s approval and qualified people; a floor stand does the job.',
      'Hung from the ceiling grid, if a cable tie will reach': 'Rigging from a ceiling or a grid is for the venue’s qualified people to approve — not a cable tie.',
    },
  },
  {
    id: 'rm.set.2',
    page: 'setting',
    prompt: 'The room sounds boomy and full of flutter. What could be the right room-mic choice?',
    options: ['Closer mics as the base — maybe no room mic at all', 'A room mic farther out, to hear more of the room', 'Two room mics far apart, so that the flutter evens itself out'],
    correct: 'Closer mics as the base — maybe no room mic at all',
    explain: 'With a poor-sounding room, overheads and closer mics are the reliable base; record a room option only if it earns its channel. A room feed is optional.',
    why: {
      'A room mic farther out, to hear more of the room': 'More of a poor room is more of the problem. Closer mics, or no room mic, may serve the kit better.',
      'Two room mics far apart, so that the flutter evens itself out': 'Two mics hear the same flutter twice; they do not cancel it. Start from closer mics.',
    },
  },
  {
    id: 'rm.set.3',
    page: 'setting',
    prompt: 'Long full-kit passes, again and again, for room-mic comparisons. What protects your hearing?',
    options: ['Keeping level and time down where you are, and hearing protection', 'Comparing on headphones, which keep the kit out entirely', 'Nothing more — the mics’ maximum SPL keeps things in a safe range'],
    correct: 'Keeping level and time down where you are, and hearing protection',
    explain: 'Hearing risk depends on the level where you are and for how long: a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more. A mic’s maximum SPL is its own distortion limit.',
    why: {
      'Comparing on headphones, which keep the kit out entirely': 'Headphones add their own level on top of the kit leaking in. Keep them at a safe, comfortable level, and limit the time.',
      'Nothing more — the mics’ maximum SPL keeps things in a safe range': 'Maximum SPL says when a MIC distorts. It says nothing about your ears.',
    },
  },
  {
    id: 'rm.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which mic hears the room’s reflections the most, compared with the kit’s direct sound?',
    options: ['The one farthest from the kit', 'The one closest to the kit', 'The one with the largest body'],
    correct: 'The one farthest from the kit',
    explain: 'The direct sound falls about 6 dB each time the distance doubles, while the room’s reverberant sound stays roughly even — so farther out, the room’s share grows.',
    why: {
      'The one closest to the kit': 'Close up, the direct sound is strong and the reflections comparatively weak.',
      'The one with the largest body': 'Size says nothing about the room’s share; distance and pattern do.',
    },
  },
  {
    id: 'rm.mic.1',
    page: 'microphone',
    prompt: 'You want a room mic to hear the room from every side. Which pattern fits that question?',
    options: ['Omni', 'Cardioid', 'Hypercardioid'],
    correct: 'Omni',
    explain: 'An omni hears all round — room included. A directional pattern favours what it faces and colours the room sound arriving off-axis.',
    why: {
      Cardioid: 'A cardioid favours its front and turns down its back: it hears less of the room behind it.',
      Hypercardioid: 'A hypercardioid is more directional still: it hears even less of the room around it.',
    },
  },
  {
    id: 'rm.mic.2',
    page: 'microphone',
    prompt: 'A side-address condenser stands in front of the kit. Which part of it faces the kit?',
    options: ['The face of its body', 'The end of the body', 'The stand’s clamp and its swivel'],
    correct: 'The face of its body',
    explain: 'A side-address mic hears out of the side of its body: aim that face at the kit.',
    why: {
      'The end of the body': 'That is an end-address mic. A side-address mic is aimed with the face of its body.',
      'The stand’s clamp and its swivel': 'The clamp holds it; the face of the body is what has to point at the kit.',
    },
  },
  {
    id: 'rm.mic.3',
    page: 'microphone',
    prompt: 'Someone says a room mic has to be a condenser. What is the best reply?',
    options: ['Common, not required: a dynamic or ribbon can suit', 'Right — no other kind of mic can really hear a room', 'Right — only a condenser can handle a whole kit’s level'],
    correct: 'Common, not required: a dynamic or ribbon can suit',
    explain: 'A condenser is common, not compulsory. A ribbon or a dynamic can be a deliberate choice when its peak level, mounting, power and preamp needs suit the job — check its manual.',
    why: {
      'Right — no other kind of mic can really hear a room': 'Any mic hears the room. Type changes the sound and the needs, not whether a room is heard.',
      'Right — only a condenser can handle a whole kit’s level': 'Many dynamics handle a kit easily; check each model’s own maximum level.',
    },
  },
  {
    id: 'rm.mic.4',
    page: 'microphone',
    prompt: 'Before you connect a ribbon or a condenser as a room mic, what do you check?',
    options: ['Its manual: power, phantom compatibility, pad and level', 'Nothing — phantom power is safe for each kind of mic', 'Only that the cable run is long enough to reach the stand'],
    correct: 'Its manual: power, phantom compatibility, pad and level',
    explain: 'Phantom-power and ribbon compatibility vary: check the manual, mute the outputs before connecting or switching power, and set gain with headroom.',
    why: {
      'Nothing — phantom power is safe for each kind of mic': 'Compatibility varies by model: check the manual before connecting or switching phantom.',
      'Only that the cable run is long enough to reach the stand': 'Reach matters, but power, compatibility and level come first.',
    },
  },
  {
    id: 'rm.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 1 m in front of the kick’s front head”. A helper measures the 1 m from the snare instead. What goes wrong?',
    options: ['The mic lands somewhere else: re-measure from the front head', 'Nothing: 1 m in front of the kit is the same from each drum', 'Nothing, as long as the mic is then aimed at the snare'],
    correct: 'The mic lands somewhere else: re-measure from the front head',
    explain: 'A distance only means something with its reference. The snare sits back by the player, behind the kick’s front head, so the same 1 m puts the mic nearer the kit than the starting point means. Every readout here names its reference.',
    why: {
      'Nothing: 1 m in front of the kit is the same from each drum': 'The drums sit at different depths: the snare is back by the player, the kick’s front head well forward. The same number lands somewhere else.',
      'Nothing, as long as the mic is then aimed at the snare': 'Aim is a separate check. The distance is still read from the wrong surface.',
    },
  },
  {
    id: 'rm.place.2',
    page: 'placement',
    prompt: 'You compare spot A with spot B, a stride farther out. What makes the comparison fair?',
    options: ['Only the distance changes, heard at the same level', 'Spot B is turned up, since it is farther away', 'The aim and the height change too, to save soundcheck time'],
    correct: 'Only the distance changes, heard at the same level',
    explain: 'Change one thing at a time and match the listening level — a louder version almost always sounds better at first.',
    why: {
      'Spot B is turned up, since it is farther away': 'Match the LISTENING level, not the gain you guess. Louder will seem better whatever the position.',
      'The aim and the height change too, to save soundcheck time': 'Change several things at once and you cannot tell which one made the difference.',
    },
  },
  {
    id: 'rm.place.3',
    page: 'placement',
    prompt: 'A corner pair 4.6 m out worked well in one session. Is it worth trying in your room?',
    options: ['Yes — as an idea to try, judged in this room by ear', 'Yes — the corners are where room mics belong in a room', 'No — a spot that worked in one room only suits that room'],
    correct: 'Yes — as an idea to try, judged in this room by ear',
    explain: 'It is one example, not a prescription — but a good one to try. Corners can add width, or weaken the centre and exaggerate the room’s faults. Listen.',
    why: {
      'Yes — the corners are where room mics belong in a room': 'A corner is one choice; it can help or hurt. No position is the room-mic position.',
      'No — a spot that worked in one room only suits that room': 'Rooms differ, so it is not a rule — but it is still a sensible idea to try and judge by ear.',
    },
  },
  {
    id: 'rm.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where may a room mic’s stand go?',
    options: ['On the floor, clear of exits, walkways and players', 'In the doorway, where the room sounds open', 'Right against the kit, so the cable run stays nice and short'],
    correct: 'On the floor, clear of exits, walkways and players',
    explain: 'Keep stands and cables clear of the drummer, exits, walkways, rolling cases and other players.',
    why: {
      'In the doorway, where the room sounds open': 'A doorway is an exit and a walkway: keep it clear.',
      'Right against the kit, so the cable run stays nice and short': 'Against the kit, a stand can be hit by a stick, a cymbal or the player.',
    },
  },
  {
    id: 'rm.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Why does a distant mic on a stage hear the PA from every side?',
    options: ['The room reflects the PA back from its surfaces', 'The PA aims a beam straight at the mic', 'Distant mics turn omni, whatever type they were made as'],
    correct: 'The room reflects the PA back from its surfaces',
    explain: 'The PA’s sound reflects off the room’s surfaces like the kit’s does — so it arrives from many directions, which no single null rejects.',
    why: {
      'The PA aims a beam straight at the mic': 'The PA faces the audience; its sound still reaches the mic, partly directly and partly via the room.',
      'Distant mics turn omni, whatever type they were made as': 'A mic keeps its own pattern at any distance; the reflections come from all round.',
    },
  },
  {
    id: 'rm.ctx.1',
    page: 'context',
    prompt: 'A show is also being recorded. Where does the drum room mic usually go?',
    options: ['A separate record feed, kept out of the PA and monitors', 'Into the PA, to make the kit sound bigger in the hall', 'Into the drummer’s monitor, so the drummer hears the room'],
    correct: 'A separate record feed, kept out of the PA and monitors',
    explain: 'A distant room mic hears the PA and the monitors and costs gain before feedback; keep it on its own feed and check the routing with the system operator.',
    why: {
      'Into the PA, to make the kit sound bigger in the hall': 'In the PA it feeds the PA’s own sound back in, costing gain before feedback. The hall is already a room.',
      'Into the drummer’s monitor, so the drummer hears the room': 'In a monitor it adds an open, distant mic to a loud wedge — a feedback risk, for little gain.',
    },
  },
  {
    id: 'rm.ctx.2',
    page: 'context',
    prompt: 'The room mic is in a null of the PA on paper. Can it now be turned up safely in the house mix?',
    options: ['No — real nulls are shallow, and reflections arrive all round', 'Yes — a null removes the PA from the mic', 'Yes, as long as it stays a supercardioid aimed at the kit the whole time'],
    correct: 'No — real nulls are shallow, and reflections arrive all round',
    explain: 'A null is infinitely deep only on paper; real mics reject far less, least in the lows, and the room returns the PA from every side. Do not assume it is safe in the house system.',
    why: {
      'Yes — a null removes the PA from the mic': 'A null reduces one direct path, a little; the room still brings the PA back.',
      'Yes, as long as it stays a supercardioid aimed at the kit the whole time': 'The pattern helps a little; it does not make a distant mic safe to push in the PA.',
    },
  },
  {
    id: 'rm.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good-sounding room, nobody else in it. What could justify a room mic?',
    options: ['The room adds something the kit needs in this music', 'It makes the drums louder in the mix', 'It removes the need for overheads over the kit itself'],
    correct: 'The room adds something the kit needs in this music',
    explain: 'In a quiet studio with a good room, a room signal can become a big part of the kit’s sound — kept on its own track for later decisions.',
    why: {
      'It makes the drums louder in the mix': 'Level comes from faders; a room mic is for the room’s sound.',
      'It removes the need for overheads over the kit itself': 'A room mic is far from the kit: it adds space; the overheads carry the kit picture.',
    },
  },
  {
    id: 'rm.two.1',
    page: 'twoMic',
    prompt: 'The room mic hears the snare about 3 ms after the overhead, and the band likes the space it adds. Can you keep that delay?',
    options: ['Yes — a room mic is late by design; judge the blend by ear', 'No — it has to be lined up with the overhead before mixing', 'No — flip its polarity first, which takes the delay away'],
    correct: 'Yes — a room mic is late by design; judge the blend by ear',
    explain: 'A room mic is late by design. Listen to the blend in stereo and mono; move it if the kit loses body — but do not align it automatically.',
    why: {
      'No — it has to be lined up with the overhead before mixing': 'Aligning it changes the very relationship that made the room mic worth having. It is a creative option, not a fix.',
      'No — flip its polarity first, which takes the delay away': 'Polarity flips the sign; it does not remove a delay.',
    },
  },
  {
    id: 'rm.two.2',
    page: 'twoMic',
    prompt: 'You slide the room track earlier to line up with the snare. What else changes?',
    options: ['Every other source, and the room’s timing with them', 'Nothing else — only the snare moves when the track slides', 'Only the room’s level, not its timing'],
    correct: 'Every other source, and the room’s timing with them',
    explain: 'The whole track moves: every source and every reflection with it. That can help the snare and hurt the rest — compare the whole kit, and note the original position.',
    why: {
      'Nothing else — only the snare moves when the track slides': 'A track holds the whole kit and the room: they all move together.',
      'Only the room’s level, not its timing': 'Sliding a track changes timing, not level — for everything on it.',
    },
  },
  {
    id: 'rm.two.3',
    page: 'twoMic',
    prompt: 'Added to the overheads, the room mic makes the kick lose body. What do you try first?',
    options: ['Compare positions and levels, then polarity as a test', 'Invert the room mic for the whole session', 'Boost the room mic’s low end until the kick’s body returns'],
    correct: 'Compare positions and levels, then polarity as a test',
    explain: 'Compare placements and levels before a polarity reversal, used as a diagnostic. A polarity switch cannot generally correct an arrival difference.',
    why: {
      'Invert the room mic for the whole session': 'Polarity is a test at matched levels, not a fix for every source at once.',
      'Boost the room mic’s low end until the kick’s body returns': 'EQ cannot undo a cancellation set by arrival times; move the mic or change the level.',
    },
  },
  {
    id: 'rm.two.4',
    page: 'twoMic',
    prompt: 'A decoded Mid-Side room pair is summed to mono. What is left?',
    options: ['The Mid: the two Side signals cancel', 'Only the Side: the Mid cancels out', 'Nothing: both channels cancel'],
    correct: 'The Mid: the two Side signals cancel',
    explain: 'Left = Mid + Side, right = Mid − Side: summed, the Side cancels and the Mid remains — as long as the decode is right. The Mid still has to suit the close mics.',
    why: {
      'Only the Side: the Mid cancels out': 'The Mid is in both channels with the same sign: it adds. The Side is opposite in the two: it cancels.',
      'Nothing: both channels cancel': 'Only the Side is opposite in the two channels; the Mid adds up.',
    },
  },
  {
    id: 'rm.prac.gain',
    page: 'practice',
    prompt: 'The room channel looks fine on the recorder meter, but crashes sound harsh. What do you check?',
    options: ['The mic and preamp for overload, with headroom for the loudest pass', 'Only the recorder meter: it already shows the level is fine, so trust it', 'The fader, pulled down until the crashes calm down'],
    correct: 'The mic and preamp for overload, with headroom for the loudest pass',
    explain: 'Set input gain with the loudest full-kit passage, crashes and rimshots included. A recorder meter alone may not reveal overload earlier in the chain.',
    why: {
      'Only the recorder meter: it already shows the level is fine, so trust it': 'The meter shows the end of the chain; the mic or the preamp can overload before it.',
      'The fader, pulled down until the crashes calm down': 'A lowered fader does not undo overload at the input.',
    },
  },
  {
    id: 'rm.prac.3',
    page: 'practice',
    prompt: 'When does a room feed earn its channel?',
    options: ['When it adds space the kit needs, and holds up in mono', 'Whenever a spare channel is open, since more channels sound better', 'Only when the drummer asks to hear more room'],
    correct: 'When it adds space the kit needs, and holds up in mono',
    explain: 'Choose the position — or leave the feed out. Say what it adds, what it costs, how it sums with the other mics and that it is safe.',
    why: {
      'Whenever a spare channel is open, since more channels sound better': 'An extra open mic adds spill and arrival differences; add it for a reason.',
      'Only when the drummer asks to hear more room': 'The player’s view matters, but the feed earns its channel by what it adds to the music.',
    },
  },
  {
    id: 'rm.mix.1',
    page: 'practice',
    prompt: 'Which sets how late a room mic hears the kit?',
    options: ['The extra distance from the kit', 'The setting of the mic’s polarity switch', 'The mic’s pattern'],
    correct: 'The extra distance from the kit',
    explain: 'Only the path sets the arrival time: about 34 cm per millisecond at 20 °C.',
    why: {
      'The setting of the mic’s polarity switch': 'Polarity flips the sign; it changes no timing.',
      'The mic’s pattern': 'A pattern changes how much is heard from each direction, not when it arrives.',
    },
  },
  {
    id: 'rm.mix.2',
    page: 'practice',
    prompt: 'The PA sits in the room mic’s null on paper. What can you expect?',
    options: ['Less PA than without it, but far from silence', 'Silence from the PA in the room mic', 'More PA than it would hear if the mic faced the PA'],
    correct: 'Less PA than without it, but far from silence',
    explain: 'Real nulls are shallow, least in the lows, and the room reflects the PA from every side.',
    why: {
      'Silence from the PA in the room mic': 'A null is deep only on paper; the room brings the PA back from other directions.',
      'More PA than it would hear if the mic faced the PA': 'Facing away, the direct sound of the PA is turned down — just not to silence.',
    },
  },
  {
    id: 'rm.mix.3',
    page: 'practice',
    prompt: 'Should a room track be slid into line with the close snare as a matter of course?',
    options: ['No — compare first; alignment is a creative choice', 'Yes — a delay between two tracks is an error to fix', 'Yes, but only by flipping its polarity'],
    correct: 'No — compare first; alignment is a creative choice',
    explain: 'The delay is part of the room sound. Align only after hearing the whole kit, and write down the original position.',
    why: {
      'Yes — a delay between two tracks is an error to fix': 'Different distances give different arrivals; for a room mic that is the point.',
      'Yes, but only by flipping its polarity': 'Polarity flips the sign; it does not align anything.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.dry',
    observation: 'A clear kit with very little room',
    firstChecks: 'Position fairly near, directional aim favours the kit, or the room is absorptive: move to a safe farther site or change pattern.',
    options: ['A farther safe spot or a wider pattern, then listen to the reflections', 'Raise the room channel’s fader until the room finally appears in the mix', 'Add artificial reverb before trying the room at all'],
    correct: 'A farther safe spot or a wider pattern, then listen to the reflections',
    explain: 'Near and directional, the mic hears mostly kit. Try farther out, or an omni — and listen to whether the new reflections help.',
    why: {
      'Raise the room channel’s fader until the room finally appears in the mix': 'Louder keeps the same kit-to-room balance; the position sets it.',
      'Add artificial reverb before trying the room at all': 'Try the room’s own sound first — that is what the mic is for.',
    },
  },
  {
    id: 's.hollow',
    observation: 'The snare sounds hollow, or the centre wanders',
    firstChecks: 'Spaced pair, uneven arrivals or interaction with overhead and close tracks: compare each room channel, sum to mono, reposition or lower the troublesome channel.',
    options: ['Each room channel alone, then in mono with the others; move or lower one', 'Pan the room pair out much wider, so that the snare sits back in the middle', 'Boost the snare’s mid-range on the room channels'],
    correct: 'Each room channel alone, then in mono with the others; move or lower one',
    explain: 'Find which channel and which combination cause it, in mono — then move or lower that one.',
    why: {
      'Pan the room pair out much wider, so that the snare sits back in the middle': 'Panning cannot fix arrival differences; mono will show the problem again.',
      'Boost the snare’s mid-range on the room channels': 'EQ cannot fill notches set by arrival times.',
    },
  },
  {
    id: 's.cymbals',
    observation: 'The cymbals dominate the room mic',
    firstChecks: 'A high or line-of-sight position favours cymbals; drummer balance may contribute: compare a lower front aim and the drummer’s dynamics.',
    options: ['A lower front position or aim, and the drummer’s own balance', 'Turn all the room channels down together until the cymbals sit back', 'Raise the mic higher, above the cymbals’ line of sight'],
    correct: 'A lower front position or aim, and the drummer’s own balance',
    explain: 'High and in their line of sight, a mic favours the cymbals. Try lower and in front — and talk to the player about the balance.',
    why: {
      'Turn all the room channels down together until the cymbals sit back': 'Lowering every room channel throws away the room too; change the position first.',
      'Raise the mic higher, above the cymbals’ line of sight': 'Higher usually brings MORE cymbals, not fewer.',
    },
  },
  {
    id: 's.boom',
    observation: 'A boomy kick or uneven tom notes',
    firstChecks: 'The position may coincide with a strong room response or a nearby boundary: move the mic or the kit within the permitted room, check several notes and compare positions before EQ.',
    options: ['Move the mic (or the kit) and compare positions before any EQ', 'Cut the lows on the room mic and leave it exactly where it is now', 'Add a second room mic nearby to even the notes out'],
    correct: 'Move the mic (or the kit) and compare positions before any EQ',
    explain: 'The room answers some notes more strongly at some spots, or near a boundary: move and compare first.',
    why: {
      'Cut the lows on the room mic and leave it exactly where it is now': 'EQ treats the symptom; another spot may simply not have the problem.',
      'Add a second room mic nearby to even the notes out': 'A nearby mic hears the same room response — and adds arrival differences.',
    },
  },
  {
    id: 's.wash',
    observation: 'A wash of other instruments, or the PA',
    firstChecks: 'Reflections, open mics and leakage exceed the desired drum perspective: try a closer position or omit the room feed; check routing in live sound.',
    options: ['A closer position, or leave the room feed out; check its routing', 'Raise the drums in the room mic until they cover the rest of the band', 'Point the room mic at the PA to check how much it hears'],
    correct: 'A closer position, or leave the room feed out; check its routing',
    explain: 'If the room mic hears more of the band or the PA than the drums, move closer, leave it out, or keep it out of the PA and monitors.',
    why: {
      'Raise the drums in the room mic until they cover the rest of the band': 'You cannot raise one source inside one mic; the mic hears what the room gives it.',
      'Point the room mic at the PA to check how much it hears': 'That invites feedback. Never provoke it deliberately.',
    },
  },
  {
    id: 's.stand',
    observation: 'A room-mic stand is in a walkway or by an exit',
    firstChecks: 'Stop; move the stand and cable clear of exits, walkways and players; secure long booms.',
    options: ['Stop, move it clear of exits and walkways, and secure the cable', 'Leave it — the sound is best there, so tape a warning on it', 'Hang it from the doorframe instead, out of the way'],
    correct: 'Stop, move it clear of exits and walkways, and secure the cable',
    explain: 'Clearance comes first: exits, walkways, rolling cases and players. Choose another spot.',
    why: {
      'Leave it — the sound is best there, so tape a warning on it': 'An exit or walkway stays clear whatever the sound is like there.',
      'Hang it from the doorframe instead, out of the way': 'Nothing is fixed to the building without the venue’s approval and qualified people.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'rm.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a room-mic comparison in the order you would do them.',
    steps: [
      { text: 'Define the target: intimate kit, natural room, wide ambience, or a separate feed', early: 'Start with what the room feed is for.' },
      { text: 'Hear the kit and the room; mark safe spots, exits and walkways', early: 'Listen and mark the safe spots once you know the target.' },
      { text: 'Set one mono baseline on a floor stand; log its position, height and aim', early: 'You need safe spots marked before you set a mic.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom, per the manual', early: 'Power comes after the mic is set and cabled — with the outputs muted first.' },
      { text: 'Set input gain on the loudest full-kit passage, with headroom', early: 'Gain is set once the mic is powered.' },
      { text: 'Compare a second spot, changing only the distance, at the same level', early: 'Compare only once the level is safe — one change at a time.' },
      { text: 'Add it to the overheads and close mics; check mono; choose — or omit it', early: 'Blend and decide last, after comparing.' },
    ],
    explain: 'A sensible order: the target, safe spots, one baseline, power and gain, one change at a time, then the blend and the decision — which may be to leave it out.',
  },
];

const DOC: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the kick’s front head', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR: SetupReason = { id: 'r.clear', label: 'The stand and cable stay clear of the kit, exits, walkways and players', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND: SetupReason = { id: 'r.brand', label: 'It is the room mic most studios own', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties and by ear.' };
const FAR: SetupReason = { id: 'r.far', label: 'Farther out always gives a better room sound', role: 'wrong', feedback: 'Farther is not always better: reflections, spill and the room’s faults can make it worse.' };

const setupTasks: SetupTask[] = [
  {
    id: 'rm.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a good-sounding live room, nobody else playing. The producer wants a natural room around the kit; overheads and close mics are up; the mix may be checked in mono. One or two channels for the room.',
    setups: [
      { id: 'a', label: 'A low omni pair about 1 m in front of the kick, checked in mono', ok: true, power: 'phantom', feedback: 'An integrated, kick-rich room picture; the mono check covers the pair.' },
      { id: 'b', label: 'One large condenser 1–2 m in front of the kit, facing it', ok: true, power: 'phantom', feedback: 'A mono room-and-kit picture with more kick; simple and mono-safe.' },
      { id: 'c', label: 'A coincident pair farther out, facing the kit, compared with a mono spot', ok: true, power: 'phantom', feedback: 'Width with a stable mono sum inside the pair — then the blend with the close mics.' },
      { id: 'd', label: 'Two mics taped to the side walls, as far apart as the room allows', ok: false, power: 'phantom', feedback: 'Nothing is fixed to the walls; and the widest pair is not automatically the best.' },
      { id: 'e', label: 'A mic in the doorway, where the room sounds most open', ok: false, power: 'phantom', feedback: 'A doorway is an exit and a walkway: keep it clear.' },
    ],
    reasons: [DOC, CLEAR, { id: 'r.mono', label: 'It is checked with the other mics, in stereo and in mono', role: 'required', feedback: 'Say how it will be checked with the overheads and close mics.' }, { id: 'r.track', label: 'It is kept on its own track for later decisions', role: 'optional', feedback: 'A fair studio reason.' }, BRAND, FAR],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point, clearance, and a check with the other mics in mono.',
  },
  {
    id: 'rm.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud live show in a club, being recorded. The PA and the monitors are busy; gain before feedback is tight. One spare input.',
    setups: [
      { id: 'a', label: 'A room mic for the recording only, kept out of the PA and the monitors', ok: true, power: 'phantom', feedback: 'A separate record feed, routed away from the PA and wedges — checked with the system operator.' },
      { id: 'b', label: 'No room mic: the close mics and the overheads carry the recording', ok: true, power: 'none', feedback: 'A fair choice when the room or the stage would add more spill than space.' },
      { id: 'c', label: 'A distant room mic in the PA, to make the kit bigger in the hall', ok: false, power: 'phantom', feedback: 'In the PA it costs gain before feedback and feeds the PA back into itself.' },
      { id: 'd', label: 'A room mic in the drummer’s monitor mix', ok: false, power: 'phantom', feedback: 'An open distant mic in a loud wedge is a feedback risk for little gain.' },
      { id: 'e', label: 'A room mic pointed at the PA to check its level in soundcheck', ok: false, power: 'phantom', feedback: 'Never provoke feedback; the system operator checks routing and margin.' },
    ],
    reasons: [CLEAR, { id: 'r.route', label: 'Its routing keeps it out of the PA and the monitor mixes', role: 'required', feedback: 'Say where the feed goes — and where it does not.' }, { id: 'r.gbf', label: 'It leaves gain before feedback for the mics the audience needs', role: 'required', feedback: 'On a loud stage, say what it does for gain before feedback.' }, { id: 'r.op', label: 'The system operator checks the routing and margin at show level', role: 'optional', feedback: 'A fair live reason.' }, BRAND, FAR],
    explain: 'Two choices pass — one with no room mic at all. What passes is the reasoning: clearance, routing, and gain before feedback.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: a room mic 5 m from the kit and an overhead 1 m away. Which hears the snare first, and by about how much?', options: ['The overhead, by about 12 ms', 'The room mic, since it hears the room', 'Both at once: sound arrives everywhere together'], after: 'Step through: the direct sound comes first, then the reflections. Every 34 cm of extra path is about 1 ms.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'In front, close up'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a room mic a long stride farther from the kit. What changes?', options: ['More room, less direct kit', 'More direct kit, less room', 'It depends on this room'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is behind and to one side of a room mic that faces the kit. How can its pattern help?', options: ['Turn it, or choose a pattern, so a null faces the PA', 'It cannot help — the PA is behind it', 'Only turning the PA down helps'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the room mic’s polarity, what happens to its delay behind the overhead?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What does a room mic hear that a close mic mostly does not?',
    options: ['The kit blended, and the room answering', 'Only the kick, which carries the farthest of the drums', 'Only the cymbals, which hang highest'],
    correct: 'The kit blended, and the room answering',
    explain: 'A room mic hears the kit after its parts have begun to blend — plus the room’s reflections and decay.',
    why: {
      'Only the kick, which carries the farthest of the drums': 'It hears the whole kit, blended, and the room.',
      'Only the cymbals, which hang highest': 'It hears the whole kit, blended, and the room.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Is a room feed required for a good drum recording?',
    options: ['No — it is optional; leaving it out can be right', 'Yes — a drum recording needs one to sound finished', 'Yes, whenever the room is bigger than the kit'],
    correct: 'No — it is optional; leaving it out can be right',
    explain: 'A room feed is optional; with a poor room, closer mics may serve the kit better.',
    why: {
      'Yes — a drum recording needs one to sound finished': 'A room mic is a choice for the music and the room, not a requirement.',
      'Yes, whenever the room is bigger than the kit': 'Size is not quality: a poor-sounding room may be better left out.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'About how long does sound take to travel 3.4 m at room temperature?',
    options: ['About 10 ms', 'About 1 ms', 'About 100 ms'],
    correct: 'About 10 ms',
    explain: 'About 343 m/s at 20 °C — 34 cm per millisecond: 3.4 m is about 10 ms.',
    why: {
      'About 1 ms': 'One millisecond is about 34 cm.',
      'About 100 ms': 'A hundred milliseconds is about 34 m.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'After the direct sound, what reaches a room mic next?',
    options: ['Reflections from the nearest surfaces', 'Nothing more: one sound makes one arrival', 'The same sound, louder'],
    correct: 'Reflections from the nearest surfaces',
    explain: 'The floor, the walls and the ceiling send the sound back, the nearest first, then the rest blend into the decay.',
    why: {
      'Nothing more: one sound makes one arrival': 'Every surface reflects the sound: more arrivals follow.',
      'The same sound, louder': 'Reflections arrive later and, after bouncing, usually weaker.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where can a room mic’s stand go?',
    options: ['On the floor, clear of exits and walkways', 'Fixed to a wall, if the sound is best there', 'In a doorway, where the room opens up'],
    correct: 'On the floor, clear of exits and walkways',
    explain: 'Floor stands, clear of exits, walkways, cases and players; nothing fixed to the building without the venue’s approval and qualified people.',
    why: {
      'Fixed to a wall, if the sound is best there': 'Nothing is fixed to a wall without the venue’s approval and qualified people.',
      'In a doorway, where the room opens up': 'A doorway is an exit: keep it clear.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your room mic is rated to 140 dB SPL. What does that tell you about sitting in the room through long full-kit passes?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the kit stays below the mic’s 140 dB', 'It is safe as long as you sit near the room mic'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the kit stays below the mic’s 140 dB': 'A mic’s rating is about the mic. Hearing risk depends on the level where you are and for how long.',
      'It is safe as long as you sit near the room mic': 'Where the mic is says nothing about your ears. Measure where you listen, and limit the time.',
    },
  },
];

export const M10_LESSON: Lesson = {
  id: 'M10',
  labId: 'drums',
  title: 'Drum Room Mics',
  subtitle: 'The kit and its room — close, low in front, farther out, in the corners',
  noun: { one: 'drum room', many: 'drum rooms', subject: 'drum kit' },
  model: M10_MODEL,
  micTypeIds: ['roomLdc', 'roomPencil', 'ohLdc'],
  zones: M10_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Room mics hear the kit after its parts have begun to blend in the space — and the room answering back: early reflections from the floor, the walls and the ceiling, then the decay.', src: 'M10-LESSON' },
    { title: 'WHERE YOU MEET THEM', text: 'In studio drum recordings with a useful room, and as separate feeds for live recordings and broadcasts. A room feed is optional — the right choice may be none.', src: 'S-REC1' },
    { title: 'THEIR JOB', text: 'To add space: an integrated kit picture from low and close, a natural room from farther out, or wide ambience. No distance is a “room mic” by itself — what it hears depends on the room, the kit, the pattern and the aim.', src: 'M10-LESSON' },
    { title: 'THIS ROOM', text: 'A studio live room about 6.5 × 5.4 m with a 3 m ceiling, the kit near the back wall, the door behind the drummer’s right — a drawing value, not a rule. Your room is the one that counts.', src: 'ROOM-DD' },
  ],
  sound: {
    stages: [{ title: 'Direct sound', text: 'The kit’s sound reaches the mic along the straight path.' }, { title: 'Early reflections', text: 'The nearest surfaces send it back.' }, { title: 'Decay', text: 'Many bounces blend into the room’s decay.' }, { title: 'The balance', text: 'Farther out, the room’s share grows.' }],
    attack: 'The direct sound arrives first, along the straight path from each drum and cymbal — later the farther the mic is from the kit, about 3 ms per metre.',
    body: 'Then the room answers: early reflections from the nearest surfaces, a few milliseconds behind, and after many bounces the decay. Close mics hear mostly direct sound; a distant mic hears a bigger share of the room.',
    head: { diameterMm: 14 * 25.4, rods: 10, label: '14 in snare head', strikeSrc: 'YMH-TCS', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'kit', label: 'the kit', short: 'KIT', tag: 'THE SOURCE', note: 'Near the back wall. A room mic usually faces the kit’s middle — the line from the kick through the snare is a useful centre.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan' } },
      { id: 'walls', label: 'the walls', short: 'WALLS', tag: 'REFLECTIONS', note: 'They send the kit’s sound back. Near a wall, a mic hears that reflection strongly — a boom or a hollow sound can come from a nearby boundary. Nothing is fixed to them.', scene: 'all', prov: { kind: 'illustrative', reason: 'room drawing default' } },
      { id: 'floor', label: 'the floor', short: 'FLOOR', tag: 'FIRST ECHO', note: 'Often the first reflection to arrive: a mic near the floor hears the direct sound and its floor echo almost together.', scene: 'studio', prov: { kind: 'illustrative', reason: 'room drawing default' } },
      { id: 'ceiling', label: 'the ceiling', short: 'CEILING', tag: 'ABOVE', note: 'About 3 m up here. High mics hear its reflection sooner; nothing hangs from it without the venue’s approval and qualified people.', scene: 'studio', prov: { kind: 'illustrative', reason: 'room drawing default (3 m)' } },
      { id: 'corners', label: 'the front corners', short: 'CORNERS', tag: 'FAR', note: 'The farthest spots from the kit here — about 4.6 m (15 ft). Mostly room: width and decay, and the room’s faults too.', scene: 'studio', prov: { kind: 'illustrative', reason: 'room sized so 15 ft reaches the corners' } },
      { id: 'door', label: 'the door and the walkway', short: 'DOOR', tag: 'KEEP CLEAR', note: 'Behind the drummer’s right, with the route to the kit. No stand or cable goes in it.', scene: 'all', prov: { kind: 'illustrative', reason: 'room drawing default' } },
      { id: 'pa', label: 'the PA', short: 'PA', tag: 'HEARD TOO', note: 'At the stage’s front, facing the audience. A distant room mic hears it — directly, and from the room — and costs gain before feedback.', scene: 'stage', prov: { kind: 'illustrative', reason: 'a typical small stage' } },
      { id: 'monitors', label: 'the stage monitors', short: 'MONITORS', tag: 'SPILL', note: 'The drummer’s fill and another player’s wedge, by the kit: a room mic facing the kit hears them in front of it, where no null reaches.', scene: 'stage', prov: { kind: 'illustrative', reason: 'M01’s stage positions' } },
      { id: 'audience', label: 'the audience side', short: 'AUDIENCE', tag: 'THE HALL', note: 'The hall is a room too: on a show, the audience already hears the kit and the hall. A room mic usually feeds a recording, not the PA.', scene: 'stage', prov: { kind: 'illustrative', reason: 'a typical small stage' } },
    ],
    stage: 'On a stage the same space holds a PA at the front and monitors by the kit. A distant mic hears them as well as the kit.',
    studio: 'In a studio the room’s own sound is what a room mic is for — if the room is a good one.',
  },
  diagnostic,
  practice: {
    task: 'Choose a room setup for each brief — or choose none. More than one choice can pass when its reasoning and safety checks are sound.',
    fields: [
      { id: 'target', label: 'Target', kind: 'choice', choices: ['Intimate kit', 'Natural room', 'Wide ambience', 'Separate feed'] },
      { id: 'a', label: 'Position A: mic, pattern, distance, height, aim', kind: 'text' },
      { id: 'b', label: 'Position B: what changed', kind: 'text' },
      { id: 'heard', label: 'Kick, snare, cymbals, reflections and decay (tendencies)', kind: 'text' },
      { id: 'mono', label: 'Mono with the overheads and close mics', kind: 'text' },
      { id: 'route', label: 'PA, monitors, record, broadcast', kind: 'text' },
      { id: 'notes', label: 'Chosen position, or left out — and why', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The room — its size, ceiling, door and walkway — drawing defaults sized so a corner pair is 15 ft from the kit.', dims: [] },
    { text: 'The low pair’s height and spacing, the large condenser’s height, the corner pair’s height, the stride between the two trial spots, and where the mics aim (the kit’s middle) — drawing defaults.', dims: [] },
    { text: 'The PA and monitor positions — ILLUSTRATIVE.', dims: [] },
    { text: 'Kit positions, heights and tilts; the drummer’s envelope — drawing defaults.', dims: [] },
    { text: 'Every keep-out clearance, including each cymbal’s swing — ILLUSTRATIVE values for the owner to approve.', dims: ['cym.hihat', 'cym.crash1', 'cym.crash2', 'cym.ride'] },
    { text: 'The floor line (M01’s floor).', dims: ['yFloor'] },
    { text: `The cymbal family’s drawing defaults: ${CYMBAL_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
    { text: `The drum family’s drawing defaults: ${DRUM_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
    { text: 'Reflections drawn as single bounces off flat surfaces; no absorption, diffusion or room modes are modelled.', dims: [] },
  ],
  live: { wedges: M10_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every kit, room and show is different: move the mics, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a drawing-value studio room around a typical 5-piece kit, straight-line arrival times at 20 °C, reflections as single bounces off flat surfaces, and mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.',
  copy: M10_COPY,
};
