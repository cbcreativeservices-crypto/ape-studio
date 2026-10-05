/**
 * C09a VIOLIN / FIDDLE — the lesson's pages as DATA (blueprint §7). The
 * words come from the owner's lesson (docs/labs/miking/source_text/Violin-
 * Fiddle-Miking-Technique.txt, cited "L<n>" in COMMENTS only) with the fixes
 * logged in docs/labs/miking/CORRECTIONS_LOG.md (V-01 … V-06) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * The 0.5–1.2 m stand distance is the lesson's own unsourced trial (L75): it
 * is offered as a modest suggestion, nothing more.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason, feedbackSymptom, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { STANDING, VIOLIN_MODEL } from './geometry.ts';
import { VIOLIN_ZONES } from './model.ts';
import { VIOLIN_COPY } from './copy.ts';

const W: Words = { noun: 'violin', player: 'violinist', moving: 'the bow’s sweep and the bow arm' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the violin',
    goal: 'Get to know the violin (the fiddle is the same instrument) — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The bow drives the strings; the bridge carries their vibration into the small hollow body. The player holds it under the chin, standing or seated, and the bow sweeps out to the right.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a bowed string becomes sound — the bow’s grip and slip, the rocking bridge, the top and back — and where the sound leaves the violin. Shown, never played.',
    credit: { scenarios: ['vn.snd.1', 'vn.snd.2', 'vn.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bow’s grip and slip keep the string going; the bridge rocks; the top and back radiate, in a pattern that changes with pitch. A mic very close hears one slice; a little distance blends the whole violin — tendencies, and violins vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the violin sits — under the chin, the bow’s sweep and the bow arm, the music stand and the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['vn.set.1', 'vn.set.2', 'vn.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bow sweeps out to the player’s right and the bow arm with it; the head is at the chin rest. No mic, stand or cable goes there. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the violin by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['vn.mic.1', 'vn.mic.2', 'vn.mic.3', 'vn.mic.4', 'vn.rec.1'], note: 'Answer the five checks (one reaches back to how the violin sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A stand mic in front gives the integrated violin; a miniature on the violin stays put as the player moves. Both condensers need phantom power.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — in front of the player and a little above the violin, aimed at the bridge, clear of the bow — then move the mic and see what changes.',
    credit: { scenarios: ['vn.place.1', 'vn.place.2', 'vn.place.3', 'vn.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named part — the bridge — not a rule; the stand distances are modest suggestions. Distance, height and angle are separate things to try, and the bow’s clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a fiddle on a loud stage and a solo violin in a studio need different choices.',
    credit: { scenarios: ['vn.ctx.1', 'vn.ctx.2', 'vn.ctx.studio', 'vn.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture, the violin’s top reflects stage sound into the mic, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close and a farther mic on one violin can sound thin together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['vn.two.1', 'vn.two.2', 'vn.two.3', 'vn.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the violin at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — distance, angle, the pattern, the player’s movement, the mount and the combination — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one violin mic in the right order, choose and justify a setup for a studio solo and a live fiddle, and say what would justify a second mic.',
    credit: { scenarios: ['vn.prac.order', 'vn.prac.gain', 'vn.prac.setup1', 'vn.prac.setup2', 'vn.prac.3', 'vn.mix.1', 'vn.mix.2', 'vn.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real violin.' },
    takeaway: 'Safe clearance from the bow, the bow arm and the player’s head, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: vn.snd.* L6 (complex,
 * frequency-dependent radiation) and standard string physics · vn.set.* L6,
 * L7, L65 · vn.mic.* L29, L36, L37 · vn.place.* L9, L36, L45 · vn.ctx.* L35,
 * L38 · vn.two.* L33 · vn.prac.* / vn.mix.* L33, L65-L71.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'vn.snd.1',
    page: 'sound',
    prompt: 'How does a bow keep a violin note sounding?',
    options: ['It grips and drags the string, then lets it slip back — every cycle', 'It strikes the string again and again, faster than the eye can follow', 'It presses the string down onto the fingerboard to start the note'],
    correct: 'It grips and drags the string, then lets it slip back — every cycle',
    explain: 'Rosin on the hair grips the string and drags it with the bow; when the string’s pull wins, it slips back and is caught again. Grip and slip repeat once every vibration, for as long as the bow moves.',
    why: {
      'It strikes the string again and again, faster than the eye can follow': 'A bow never strikes: it grips and lets go. A struck string (a piano’s) is a different action.',
      'It presses the string down onto the fingerboard to start the note': 'The left hand’s fingers press the strings to choose the note; the bow sets them vibrating.',
    },
  },
  {
    id: 'vn.snd.2',
    page: 'sound',
    prompt: 'Why can a mic very close to one f-hole give a lopsided picture of the violin?',
    options: ['The violin radiates differently from each part, and at each pitch', 'The f-hole is the one part of the violin that radiates sound at all', 'The f-hole blocks the high frequencies coming out of the body'],
    correct: 'The violin radiates differently from each part, and at each pitch',
    explain: 'The top, the back and the f-holes each radiate their own mix, and the pattern changes with pitch. Very close to one spot, the mic hears that spot; a little distance blends them.',
    why: {
      'The f-hole is the one part of the violin that radiates sound at all': 'The top and back radiate most of the sound; the f-holes add the air’s breathing.',
      'The f-hole blocks the high frequencies coming out of the body': 'An opening blocks nothing; the issue is that one spot is not the whole violin.',
    },
  },
  {
    id: 'vn.snd.3',
    page: 'sound',
    prompt: 'One of the string’s shapes has a still point right under the bow. What happens to that shape?',
    options: ['The bow cannot drive it there, so it is weak in the sound', 'It becomes the loudest shape, because the bow presses right there', 'Nothing changes: the bow drives all of the shapes the same'],
    correct: 'The bow cannot drive it there, so it is weak in the sound',
    explain: 'A point can only drive a shape as much as the string moves there in that shape. On a still point it cannot — so moving the bow toward or away from the bridge changes which overtones are strong.',
    why: {
      'It becomes the loudest shape, because the bow presses right there': 'The string does not move at a still point, so the bow cannot push that shape.',
      'Nothing changes: the bow drives all of the shapes the same': 'A shape is driven only where the string moves in it. On a still point, not at all.',
    },
  },
  hearingCheck('vn.set.1', W),
  {
    id: 'vn.set.2',
    page: 'setting',
    prompt: 'On which side of the player does the bow sweep, out to arm’s length?',
    options: ['The player’s right, toward the audience at the tip of a stroke', 'The player’s left, out past the scroll and the left hand', 'Straight up above the player’s head, clear of the bow and of the music stand'],
    correct: 'The player’s right, toward the audience at the tip of a stroke',
    explain: 'The bow arm is on the right: at the tip of a stroke the hand is out at arm’s length, forward and to the right. The other end of the bow swings back over the left shoulder at the frog. A stand mic comes in from the front, clear of both.',
    why: {
      'The player’s left, out past the scroll and the left hand': 'The left hand holds the neck; the bow arm and its sweep are on the right.',
      'Straight up above the player’s head, clear of the bow and of the music stand': 'The bow crosses the strings at the violin, at shoulder height, sweeping across — not up.',
    },
  },
  {
    id: 'vn.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask the violinist?',
    options: ['Their posture, the bow’s reach, the passages and the sound wanted', 'Whether it is a violin or a fiddle, since each has its own mic position', 'Nothing: a starting point already says where the mic goes'],
    correct: 'Their posture, the bow’s reach, the passages and the sound wanted',
    explain: 'Check the real playing posture, the full up- and down-bow, the highest and lowest notes and the loudest and softest phrases — and the sound wanted: a classical solo and a fiddle in a band ask for different things.',
    why: {
      'Whether it is a violin or a fiddle, since each has its own mic position': 'Violin and fiddle are the same instrument; the music and the setting decide the mic, not the name.',
      'Nothing: a starting point already says where the mic goes': 'A starting point says where to begin — but only where the bow and the player cannot reach it.',
    },
  },
  {
    id: 'vn.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic very close to where the bow meets the strings tends to hear more of…',
    options: ['The bow — articulation, and rosin and scratch', 'The air breathing in and out of the f-holes in the low notes', 'The whole violin and the room, blended together'],
    correct: 'The bow — articulation, and rosin and scratch',
    explain: 'The bite starts where the hair grips the string, so a mic close to it hears more of it — and can overstate the friction. A tendency, to check by ear.',
    why: {
      'The air breathing in and out of the f-holes in the low notes': 'That leaves from the f-holes — a different place from the bow.',
      'The whole violin and the room, blended together': 'That is what a mic farther away tends to hear. Up close, one region dominates.',
    },
  },
  {
    id: 'vn.mic.1',
    page: 'microphone',
    prompt: 'Why might a miniature clipped to the violin suit a fiddler who moves?',
    options: ['It moves with the violin, so the distance holds as the player turns', 'Its clip stops it from hearing the monitors and the rest of the stage', 'It needs no power, so a spare input without phantom will do'],
    correct: 'It moves with the violin, so the distance holds as the player turns',
    explain: 'On the violin, the capsule keeps one distance however the player turns — a stand mic has a working zone the player can leave. It still hears the stage, and its close view is more coloured.',
    why: {
      'Its clip stops it from hearing the monitors and the rest of the stage': 'A clip is a mount, not a pattern: the mic still hears the stage.',
      'It needs no power, so a spare input without phantom will do': 'A miniature condenser needs phantom power, through its adapter.',
    },
  },
  {
    id: 'vn.mic.2',
    page: 'microphone',
    prompt: 'A miniature aimed at an f-hole instead of the bridge tends to give…',
    options: ['More level, and often a slightly duller colour', 'Less level, and a much brighter, thinner sound', 'Exactly the same sound, only quieter overall'],
    correct: 'More level, and often a slightly duller colour',
    explain: 'Toward the f-hole there is more output; the colour often turns a little duller than aimed at the bridge. One setup’s observation — check it by ear on the real violin.',
    why: {
      'Less level, and a much brighter, thinner sound': 'The f-hole tends to give more level, not less — and a duller rather than brighter colour.',
      'Exactly the same sound, only quieter overall': 'A close mic’s aim changes both the level and the colour.',
    },
  },
  {
    id: 'vn.mic.3',
    page: 'microphone',
    prompt: 'In a good, quiet room, why might you try an omni on a solo violin?',
    options: ['For a broad, even pickup of the violin and the room', 'Because an omni rejects the room better than a cardioid', 'Because an omni works only at distances under 10 cm'],
    correct: 'For a broad, even pickup of the violin and the room',
    explain: 'An omni hears all round, with no directional proximity effect — welcome when the room adds to the sound. A directional mic helps when the room is poor or other players are close.',
    why: {
      'Because an omni rejects the room better than a cardioid': 'An omni rejects nothing: it hears more of the room, not less.',
      'Because an omni works only at distances under 10 cm': 'An omni works at any distance; its job here is the broad, even picture.',
    },
  },
  {
    id: 'vn.mic.4',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics can you use?',
    options: ['Neither: both condensers need phantom power to work', 'The miniature, because its clip carries the power', 'The stand condenser, as long as its cable is short'],
    correct: 'Neither: both condensers need phantom power to work',
    explain: 'Both of these mics are condensers: the stand mic needs phantom power, and the miniature needs it through its adapter. Find a powered input — or a different kind of mic.',
    why: {
      'The miniature, because its clip carries the power': 'A clip is a mount. The miniature still needs phantom power through its adapter.',
      'The stand condenser, as long as its cable is short': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'vn.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 30 cm in front of where the bow meets the strings”. What is it measured from?',
    options: ['The strings where the bow meets them — not the scroll or the body', 'The player’s chin, where the violin rests against the player’s collarbone', 'The floor under the player, since that is easy to measure'],
    correct: 'The strings where the bow meets them — not the scroll or the body',
    explain: 'A distance means something only with the part it is measured from. The same 30 cm from the chin rest or the scroll puts the mic somewhere else — which is why every readout names its reference.',
    why: {
      'The player’s chin, where the violin rests against the player’s collarbone': 'That is a different reference, well behind the bow.',
      'The floor under the player, since that is easy to measure': 'The floor says nothing about the mic’s distance from the violin.',
    },
  },
  {
    id: 'vn.place.2',
    page: 'placement',
    prompt: 'You bring the mic from about a metre to about 30 cm from the violin. What tends to change?',
    options: ['More bow articulation and detail; less of the room', 'Only the level rises; the tone stays exactly the same', 'Less low end, because the mic is now nearer the strings'],
    correct: 'More bow articulation and detail; less of the room',
    explain: 'Closer tends to bring more of the bow and the strings, more separation, and less room. Too close, the scratch can take over — and a directional mic adds low end (proximity effect).',
    why: {
      'Only the level rises; the tone stays exactly the same': 'Distance changes the balance too: more bow, less room, more proximity effect.',
      'Less low end, because the mic is now nearer the strings': 'A directional mic moved closer tends to gain low end, not lose it.',
    },
  },
  {
    id: 'vn.place.3',
    page: 'placement',
    prompt: 'Where should a body-clip miniature’s capsule point on a violin?',
    options: ['At the bridge or an f-hole, away from the player’s face', 'At the player’s chin, to catch the breath with the note', 'At the scroll, which is farthest from the bow'],
    correct: 'At the bridge or an f-hole, away from the player’s face',
    explain: 'On the bass-side rib, the capsule looks over the top at the bridge (brighter) or toward an f-hole (more level, duller) — pointed away from the head so breath noise stays out.',
    why: {
      'At the player’s chin, to catch the breath with the note': 'Breath noise is what to avoid: point it away from the head.',
      'At the scroll, which is farthest from the bow': 'The scroll radiates little. The bridge and the f-holes are the useful targets.',
    },
  },
  {
    id: 'vn.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a violin mic, its stand and its cable stay clear of?',
    options: ['The bow’s sweep, the bow arm and the player’s head', 'The front of the violin, so the audience can see it', 'The music stand, so the player can read the part and the conductor'],
    correct: 'The bow’s sweep, the bow arm and the player’s head',
    explain: 'Clearance comes first: both ends of the bow, the arm out to the tip of a stroke, and the head at the chin rest. Stop the player before anything moves, and check a full bow again.',
    why: {
      'The front of the violin, so the audience can see it': 'In front is where a stand mic usually goes. What must stay clear is what moves.',
      'The music stand, so the player can read the part and the conductor': 'Sight lines matter, but the safety question is what moves: the bow, the arm, the head.',
    },
  },
  {
    id: 'vn.ctx.1',
    page: 'context',
    prompt: 'A fiddler plays a solo beside a banjo and drums on a loud stage. A good first step for the mic?',
    options: ['Closer placement — or an approved miniature — with the pattern aimed', 'A farther mic, so the band blends naturally into the violin', 'Turn the violin channel up until it rises above the rest of the band'],
    correct: 'Closer placement — or an approved miniature — with the pattern aimed',
    explain: 'On a loud stage, closer pickup and an aimed pattern give more violin relative to the band and the monitors. A farther mic suits a quiet room; more gain raises the band in that channel too.',
    why: {
      'A farther mic, so the band blends naturally into the violin': 'Farther brings in more band and monitors — the opposite of what a loud stage needs.',
      'Turn the violin channel up until it rises above the rest of the band': 'More gain raises everything that mic hears, and brings feedback closer.',
    },
  },
  superNull('vn.ctx.2', 'context', 'wedge'),
  {
    id: 'vn.ctx.studio',
    page: 'context',
    prompt: 'A solo classical violin in a good studio room. What is a fair first choice?',
    options: ['One stand mic in front and above, then small changes by ear', 'Two close miniatures, one on each side, to make it stereo', 'A mic as close to the bridge as it will go, for the detail'],
    correct: 'One stand mic in front and above, then small changes by ear',
    explain: 'A modest distance blends the violin and the room into a balanced line; adjust height, angle and distance by ear. Two close mics are optional, and very close can sound scratchy.',
    why: {
      'Two close miniatures, one on each side, to make it stereo': 'Stereo is not a requirement for a small solo instrument, and two close mics can move the image.',
      'A mic as close to the bridge as it will go, for the detail': 'Very close overstates friction and rosin. Start with a blended view.',
    },
  },
  {
    id: 'vn.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · How does a bow keep the violin sounding?',
    options: ['By gripping the string and letting it slip back, every cycle', 'By striking the string many times a second, faster than we can see', 'By blowing air across the f-holes as it moves'],
    correct: 'By gripping the string and letting it slip back, every cycle',
    explain: 'Grip and slip, once every vibration — so the sound carries the bow’s own texture as well as the note. A close mic hears more of that texture.',
    why: {
      'By striking the string many times a second, faster than we can see': 'A bow never strikes; it grips and releases.',
      'By blowing air across the f-holes as it moves': 'The bow touches only the strings; the f-holes breathe because the body moves.',
    },
  },
  {
    id: 'vn.two.1',
    page: 'twoMic',
    prompt: 'Why can a close spot mic and a farther mic on one violin sound thin together?',
    options: ['The sound reaches them at different times, so some pitches cancel', 'The farther mic inverts the sound on its way there, so it cancels', 'Two mics on one source cancel each other’s low end in the sum'],
    correct: 'The sound reaches them at different times, so some pitches cancel',
    explain: 'The farther mic hears each note a little later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one source cancel each other’s low end in the sum': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('vn.two.2'),
  matchedLevels('vn.two.3'),
  {
    id: 'vn.two.4',
    page: 'twoMic',
    prompt: 'In a chamber recording with a main pair up, how do you use a violin spot mic?',
    options: ['Raise it only for a stated balance, and check it in mono', 'Make it the loudest channel, since the violin plays the melody', 'Mute the main pair whenever the violin has the tune'],
    correct: 'Raise it only for a stated balance, and check it in mono',
    explain: 'The main pair carries the ensemble image; a spot supports it. Bring it up gradually, watch that the player does not leap forward, and check the blend in stereo and mono.',
    why: {
      'Make it the loudest channel, since the violin plays the melody': 'A loud spot pulls the first chair unnaturally forward.',
      'Mute the main pair whenever the violin has the tune': 'The main pair is the picture of the group; the spot only supports it.',
    },
  },
  gainCheck('vn.prac.gain', W),
  {
    id: 'vn.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second violin channel?',
    options: ['The first mic works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more options to choose from later on', 'The violin needs more level in the mix than one mic can give it'],
    correct: 'The first mic works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The violin needs more level in the mix than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'vn.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “5–10 cm from the side of the violin”. What is it measured from?',
    options: ['The violin’s rib on that side, by the lower bout', 'The bridge, which all violin distances are measured from', 'The player’s shoulder, where the violin rests'],
    correct: 'The violin’s rib on that side, by the lower bout',
    explain: 'A distance belongs to the part it names. Some starting points name the bridge, some where the bow meets the strings, and this one the side — different numbers for the same spot.',
    why: {
      'The bridge, which all violin distances are measured from': 'Starting points name different parts; this one names the side.',
      'The player’s shoulder, where the violin rests': 'The shoulder is not part of the violin. Measure from the side it names.',
    },
  },
  nullOnPaper('vn.mix.2', 'wedge'),
  removeDelay('vn.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'vn.sym.scratch',
    observation: 'Scratch or rosin noise dominates',
    firstChecks: 'Is the mic too close to the bridge and the bow? Move it outward, up or back, and reassess the full phrase.',
    options: ['Move the mic outward, up or back, then play the full phrase', 'Cut the high frequencies on the violin channel first', 'Ask the player to bow more lightly for the whole of the session'],
    correct: 'Move the mic outward, up or back, then play the full phrase',
    explain: 'Very close to the bow, the mic overstates the friction. A little more distance or a different angle blends the note and the bow.',
    why: {
      'Cut the high frequencies on the violin channel first': 'EQ dulls the violin along with the scratch. Move the mic first.',
      'Ask the player to bow more lightly for the whole of the session': 'The bowing is the player’s art. The mic’s position is yours to change.',
    },
  },
  {
    id: 'vn.sym.dull',
    observation: 'The tone is dull or lacks detail',
    firstChecks: 'Is the mic too far, off axis or turned toward an f-hole? Adjust the angle and the position, and check the stage spill.',
    options: ['Too far, off axis, or turned to an f-hole: adjust angle and position', 'Boost the treble on the channel until the detail comes back', 'Swap to an omni mic, the brighter-sounding pattern on a violin up close'],
    correct: 'Too far, off axis, or turned to an f-hole: adjust angle and position',
    explain: 'Distance, an off-axis angle or an f-hole aim can each dull the sound. Change the geometry first — then check what the stage adds.',
    why: {
      'Boost the treble on the channel until the detail comes back': 'EQ adds hiss and spill along with the detail. Fix the angle first.',
      'Swap to an omni mic, the brighter-sounding pattern on a violin up close': 'A pattern does not decide brightness; position and aim do.',
    },
  },
  {
    id: 'vn.sym.string',
    observation: 'One string is much brighter than the others',
    firstChecks: 'Is the capsule localised on one region? Take a broader perspective and test all four strings.',
    options: ['Take a broader view and test all four strings', 'Cut that string’s frequencies with a narrow EQ', 'Ask the player to avoid that string where possible'],
    correct: 'Take a broader view and test all four strings',
    explain: 'A close capsule can favour the string or region it faces. A little more distance or a different angle evens the strings out.',
    why: {
      'Cut that string’s frequencies with a narrow EQ': 'Notes move between strings; a fixed EQ cannot follow. Fix the view.',
      'Ask the player to avoid that string where possible': 'The music decides the strings. The mic should serve all four.',
    },
  },
  {
    id: 'vn.sym.turn',
    observation: 'The tone changes as the player turns',
    firstChecks: 'Does the stand mic lose the view of the top? Define a working zone with the player, or test an approved miniature.',
    options: ['Agree a working zone, or try an approved miniature', 'Compress the channel hard until the level stops changing', 'Ask the player to stand completely still'],
    correct: 'Agree a working zone, or try an approved miniature',
    explain: 'A stand mic hears the violin from one place. Mark the spot with the player, or use a miniature that moves with the violin.',
    why: {
      'Compress the channel hard until the level stops changing': 'Compression evens the level but not the changing tone.',
      'Ask the player to stand completely still': 'Movement is part of playing; the setup should allow for it.',
    },
  },
  feedbackSymptom('vn.sym.feedback', W),
  hollowSymptom('vn.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'vn.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic violin setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: posture, the bow’s full reach, the passages and the sound wanted', early: 'Start with the player and the music.' },
      { text: 'Hear the violin unamplified in the room, low string to high', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand or an approved clip', early: 'Choose once you know the player and the sound.' },
      { text: 'With the player stopped, place it in front and a little above, clear of the bow', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on quiet AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance, height and angle one change at a time, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck a full bow and the player’s movement', early: 'Secure it last, then watch the player’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest passage.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'vn.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo classical violin, a good quiet room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Small condenser about 0.5–1 m in front and a little above, aimed at the bridge', ok: true, power: 'phantom', feedback: 'A recommended starting point that blends the violin and the room — then small changes by ear.' },
      { id: 'b', label: 'Small condenser about 30 cm in front of where the bow meets the strings', ok: true, power: 'phantom', feedback: 'A recommended starting point for more definition — listen that the bow does not take over.' },
      { id: 'c', label: 'A mic a few centimetres from the bridge, for the most detail', ok: false, power: 'phantom', feedback: 'Very close to the bridge the friction and rosin take over — and the mic sits in the bow’s way.' },
      { id: 'd', label: 'Two miniatures, one on each side, to make the solo stereo', ok: false, power: 'phantom', feedback: 'Stereo is not a requirement for a small solo instrument; two close mics move the image.' },
      { id: 'e', label: 'A stand mic level with the bow arm, beside the player’s right hand', ok: false, power: 'phantom', feedback: 'That is the bow arm’s path: the mic would be struck.' },
    ],
    reasons: [docReason('the bridge or where the bow meets the strings'), clearReason('the bow’s sweep, the bow arm and the player’s head'), POWER_REASON, { id: 'r.room', label: 'A modest distance lets the good room join the sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('violin'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, clearance from the bow and the arm, and the power the mic needs.',
  },
  {
    id: 'vn.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a fiddler in a band with drums and a banjo, moving and stepping up for solos. Phantom power available.',
    setups: [
      { id: 'a', label: 'A miniature clipped to the bass-side rib, aimed at the bridge, away from the face', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the fiddle — check the clip fits and the cable is relieved.' },
      { id: 'b', label: 'A miniature on a holder behind the bridge, under the strings, checked for harshness', ok: true, power: 'phantom', feedback: 'A recommended starting point: steady as the player moves — compare under and over the strings.' },
      { id: 'c', label: 'Small condenser 1 m in front, for a natural blended sound', ok: false, power: 'phantom', feedback: 'On a loud stage a metre away hears the band and the monitors more than the fiddle.' },
      { id: 'd', label: 'A clip pushed onto the bridge, where the sound starts', ok: false, power: 'phantom', feedback: 'Nothing goes on the bridge: it can damp it and risk the instrument.' },
      { id: 'e', label: 'A miniature taped to the top, by the f-hole', ok: false, power: 'phantom', feedback: 'Never improvise on the varnish or the f-hole edge: use a mount made for the violin.' },
    ],
    reasons: [docReason('the bridge’s foot or the strings behind the bridge'), clearReason('the bow, the bow arm, the chin rest and the player’s face'), POWER_REASON, { id: 'r.move', label: 'A mic that moves with the fiddle holds the sound as the player moves', role: 'optional', feedback: 'A fair live reason for a miniature.' }, BRAND_REASON('violin'), { id: 'r.loudest', label: 'Turn it up until the fiddle is louder than the banjo', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two miniatures pass. What passes is the reasoning: a mount made for the violin, clearance from the bow and the face, the power it needs — and the movement it allows.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: how does a bow keep a note going?', options: ['It strikes the string very fast', 'It grips the string, then lets it slip', 'It presses the string against the board'], after: 'Now STEP through (or PLAY ONCE) and watch the string, the bridge and the top.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you bring the mic from a metre to about 30 cm. What changes?', options: ['More bow and detail', 'More of the room', 'It depends on this violin'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the player. Where will a supercardioid aimed at the violin reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is the difference between a violin and a fiddle?',
    options: ['None in the instrument — only the music it plays', 'A fiddle has five strings and no f-holes', 'A fiddle is held on the right shoulder'],
    correct: 'None in the instrument — only the music it plays',
    explain: 'Violin and fiddle are the same instrument named in different musical settings; the mic follows the music and the setting.',
    why: {
      'A fiddle has five strings and no f-holes': 'A fiddle is a violin: four strings, two f-holes.',
      'A fiddle is held on the right shoulder': 'Fiddlers hold it like violinists, under the chin on the left.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which part carries the strings’ vibration into the violin’s body?',
    options: ['The bridge, standing on the top', 'The chin rest, at the tail end', 'The scroll, at the end of the neck'],
    correct: 'The bridge, standing on the top',
    explain: 'The strings cross the bridge, and the bridge stands on the top: it passes their vibration into the body.',
    why: {
      'The chin rest, at the tail end': 'The chin rest is for the player’s jaw.',
      'The scroll, at the end of the neck': 'The scroll ends the pegbox; it carries little sound.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'How does a bow keep a note sounding?',
    options: ['It grips the string, then lets it slip back, every cycle', 'It strikes the string again and again, very fast', 'It holds the string still against the fingerboard'],
    correct: 'It grips the string, then lets it slip back, every cycle',
    explain: 'Grip and slip, once every vibration: the bow feeds the string as long as it moves.',
    why: {
      'It strikes the string again and again, very fast': 'A bow never strikes. It grips and lets go.',
      'It holds the string still against the fingerboard': 'The left hand stops the string; the bow sets it vibrating.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic very close to one spot on the violin tends to…',
    options: ['Overstate that spot — friction, rosin or body', 'Hear the whole violin, evenly balanced', 'Lose the high notes of the violin'],
    correct: 'Overstate that spot — friction, rosin or body',
    explain: 'The violin radiates differently from each part; very close, one region dominates. A little distance blends them.',
    why: {
      'Hear the whole violin, evenly balanced': 'That is what a little distance tends to give.',
      'Lose the high notes of the violin': 'A close mic hears the highs fine; the issue is one region dominating.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a violinist?',
    options: ['The bow’s sweep, the bow arm and the player’s head', 'The music stand, so the music can be read', 'The audience’s view of the violin'],
    correct: 'The bow’s sweep, the bow arm and the player’s head',
    explain: 'Clearance comes first: whatever moves — the bow at both ends, the arm out to the tip — and the head at the chin rest.',
    why: {
      'The music stand, so the music can be read': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the violin': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = STANDING.floorY;
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, in front, facing back at them',
    short: 'WEDGE',
    p: { x: 1500, y: floorY, z: 150 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, facing back at the player: below and behind a mic aimed back at the violin — tilting the mic matters as much as turning it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the violinist’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: floorY, z: -1250 },
    lift: 150,
    faces: { x: -0.6, y: 0, z: 0.8 },
    note: 'Off to one side, facing another player: well off the mic’s axis.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const C09A_LESSON: Lesson = {
  id: 'C09a',
  labId: 'strings',
  title: 'Violin and Fiddle',
  subtitle: 'In front and a little above, closer to the bow, or a clip on the violin',
  noun: { one: 'violin', many: 'violins' },
  model: VIOLIN_MODEL,
  micTypeIds: ['sdcCard', 'strMini'],
  zones: VIOLIN_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The violin is the smallest of the bowed string family, held under the chin on the left shoulder. Its four strings — G, D, A, E — run from the tailpiece over a thin bridge to the scroll; the bow sets them vibrating and the bridge passes that into the hollow body. A fiddle is the same instrument, named for the music it plays.', src: 'DPA-VLN' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras, quartets and solo recitals; folk, bluegrass and country bands as the fiddle; studio sessions of every kind. This lesson covers one bowed violin: a studio solo, a live fiddle, and a spot in a group.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries melodies and fast, articulate lines — and the player moves with them. Ask what the music needs: a classical soloist may want the room and a balanced line; a fiddle beside a banjo and drums may need a closer, separated sound.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A full-size violin’s body is about 36 cm long, about 59 cm with the neck and scroll. Its lowest note, the open G, is about 196 Hz. This lab draws a violin about that size, held under the chin — standing, or seated.', src: 'MET-PIQUE' },
  ],
  sound: {
    stages: [
      { title: 'The bow grips the string', text: 'Rosin on the bow hair grips the string and drags it sideways with the bow — a tiny way, many times larger here than it really moves.' },
      { title: 'The string slips back', text: 'When the string’s pull gets stronger than the grip, it slips back past its resting place, and the hair catches it again. Grip and slip repeat once every vibration: that is how a bow keeps a note going.' },
      { title: 'The string rocks the bridge', text: 'The vibrating strings pull the top of the bridge from side to side, and the bridge rocks on its two feet.' },
      { title: 'The bridge drives the top', text: 'Under one foot the top moves in and out; under the other, a small wooden post inside — the soundpost — holds the top nearly still and passes the motion to the back. The top, the back and the air inside all vibrate.' },
      { title: 'Sound leaves the body', text: 'Sound leaves from the whole top and back and the f-holes, in a pattern that changes with pitch — so a mic very close to one spot hears that spot’s own mix, and a little distance blends the violin.' },
    ],
    attack: 'The start of a note: the bow catching the string — a little rosin and hair, the bite — strongest where the bow meets the strings. A mic close to the bow tends to hear more of it, and can overstate the friction.',
    body: 'The sustained tone: the strings, the bridge, the top and back and the air inside ringing together, leaving from the whole body in a pattern that changes with pitch. A little distance tends to blend it with the room. Both are tendencies, and violins vary.',
    head: { diameterMm: 0, rods: 0, label: 'the G string', strikeSrc: 'PHYS-ET' },
  },
  setting: {
    items: [
      { id: 'violin', label: 'the violin and the violinist', short: 'VIOLIN', note: 'Held under the chin on the left shoulder, the scroll forward and to the left. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'violin/GEOMETRY_PROPOSAL.md §4 (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'bow', label: 'the bow’s sweep and the bow arm', short: 'BOW', note: 'The bow crosses the strings near the bridge and travels its whole length: out to the player’s right, forward, at the tip of a stroke; back over the left shoulder at the frog. The bow arm swings with it. No mic, stand or cable goes there.', prov: { kind: 'illustrative', reason: 'violin/GEOMETRY_PROPOSAL.md §3 bow envelope' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'head', label: 'the player’s head', short: 'HEAD', note: 'The jaw rests on the chin rest. A close mic points away from the face — breath noise is easy to catch.', prov: { kind: 'illustrative', reason: 'proposal head sphere r 110' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. They must see the music — and the conductor or the other players: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'violin2', label: 'another violin beside', short: 'VIOLIN 2', note: 'In a section or a quartet another violin sits close by; a violin spot hears it too.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'viola', label: 'a viola across the group', short: 'VIOLA', note: 'Farther away, but still heard by the violin’s mic.', prov: { kind: 'illustrative', reason: 'a typical seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to a violin mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic violin; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the group', short: 'MAIN PAIR', note: 'In a recording of a group, a main pair hears the whole ensemble; a violin mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room is part of a solo violin’s sound.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band is loud. A fiddler moves and steps up for solos: closer, aimed pickup — or a miniature that moves with the violin — helps against the stage and feedback.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A modest distance can carry the whole violin and the room; in a group, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic violin setup for a studio solo and for a live fiddle, describe an alternative position, and explain what would justify a second mic. With a real violin and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'posture', label: 'Player', kind: 'choice', choices: ['standing', 'seated'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip or holder', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bridge (or which part)', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The violin’s height above the floor (under the chin at about 1.45 m standing, 450 mm lower seated) and its 45° / 10° / 30° hold — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'Middle and upper bout widths, stop (195 mm), string length (328), bridge height and width, arching, the fingerboard and the bow length (750) — drawing defaults; the body length and lower bout are museum violins used as a modern size.', dims: [] },
    { text: 'The bow’s sweep (±25° for the string crossings), the bow hand, the bow arm, the left hand and the player’s head — illustrative envelopes; the player’s body and the chair (seated) are drawn from the proposal’s head and tail positions.', dims: [] },
    { text: 'The 0.5–1.2 m front distance is the lesson’s own trial; the side zone’s 5–10 cm reads “a few inches”; the clip and holder distances — drawing defaults.', dims: [] },
    { text: 'The miniature’s capsule and gooseneck reach, the small condenser’s diameter, and whether a body clip fits this violin’s depth (rib 30 mm plus the arching) — drawing defaults to check on the real instrument.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules; the stand distances in particular are modest suggestions. Every violin, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, the bow’s sweep as a hatched area, mic patterns and the two-mic comb as textbook shapes, and string and body motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.',
  copy: VIOLIN_COPY,
};
