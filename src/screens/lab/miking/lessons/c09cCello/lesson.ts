/**
 * C09c CELLO — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Cello-Miking-
 * Technique.txt, cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md (C-01 … C-05) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * The research stays in docs/labs/miking/cello/ and the code-only fields.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason, feedbackSymptom, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { CELLO_MODEL } from './geometry.ts';
import { CELLO_ZONES, POSTURE } from './model.ts';
import { CELLO_COPY } from './copy.ts';

const W: Words = { noun: 'cello', player: 'cellist', moving: 'the bow’s sweep and the bow arm' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the cello',
    goal: 'Get to know the cello — what it is, where you meet it, what it does in the music, and its parts, from the bridge to the endpin — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The bow drives the strings; the bridge carries their vibration into the hollow body; the body radiates it. The cellist sits behind it, and the bow sweeps out to both sides.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a bowed string becomes sound — the grip and slip of the bow, the rocking bridge, the top and back — and where the sound leaves the cello. Shown, never played.',
    credit: { scenarios: ['vc.snd.1', 'vc.snd.2', 'vc.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bow’s grip and slip keep the string going; the bridge rocks; the top, the back and the air inside radiate. A mic near the bow hears more of its bite, a mic farther away more of the whole body — tendencies, and cellos vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the cello’s surroundings — the cellist’s chair, the bow’s full sweep, the endpin, the music stand and the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['vc.set.1', 'vc.set.2', 'vc.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The bow sweeps out to both sides, the bow arm swings, and the endpin and the feet share the floor: no mic, stand or cable goes there. Ask the cellist first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the cello by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['vc.mic.1', 'vc.mic.2', 'vc.mic.3', 'vc.mic.4', 'vc.rec.1'], note: 'Answer the five checks (one reaches back to how the cello sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A stand mic gives the more natural, integrated picture; a miniature on the strings stays put as the cellist moves. Check that the mic and the channel keep the low C.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about a foot in front of the bridge, aimed at it, clear of the bow — then move the mic and see what changes.',
    credit: { scenarios: ['vc.place.1', 'vc.place.2', 'vc.place.3', 'vc.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named part — the bridge — not a rule. Distance, height and angle are separate things to try, and the bow’s clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the cellist’s wedge — and know what a pattern cannot do, why the cello’s body reflects sound into the mic, and when a close mic is not needed.',
    credit: { scenarios: ['vc.ctx.1', 'vc.ctx.2', 'vc.ctx.studio', 'vc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture, the cello’s body reflects stage sound into the mic, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close and a farther mic on one cello can sound thin together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['vc.two.1', 'vc.two.2', 'vc.two.3', 'vc.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the cello at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — distance, angle, the pattern, the room, the mount and the combination — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one cello mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['vc.prac.order', 'vc.prac.gain', 'vc.prac.setup1', 'vc.prac.setup2', 'vc.prac.3', 'vc.mix.1', 'vc.mix.2', 'vc.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real cello.' },
    takeaway: 'Safe clearance from the bow, the bow arm and the endpin, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: vc.snd.* L6, L7 (C2 ≈ 65 Hz;
 * stick-slip and the bridge are standard string physics) · vc.set.* L6, L67 ·
 * vc.mic.* L6, L7, L29, L35 · vc.place.* L9, L35, L36 · vc.ctx.* L29, L36 ·
 * vc.two.* L31 · vc.prac.* / vc.mix.* L31-L33, L67-L73.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'vc.snd.1',
    page: 'sound',
    prompt: 'How does a bow keep a cello note sounding?',
    options: ['It strikes the string again and again, faster than the eye can follow', 'It presses the string down onto the fingerboard to start it', 'It grips and drags the string, then lets it slip back — every cycle'],
    correct: 'It grips and drags the string, then lets it slip back — every cycle',
    explain: 'Rosin on the hair grips the string and drags it with the bow; when the string’s pull wins, it slips back and is caught again. Grip and slip repeat once every vibration, feeding the string energy as long as the bow moves.',
    why: {
      'It strikes the string again and again, faster than the eye can follow': 'A bow never strikes: it grips and lets go. A struck string (a piano’s) is a different action.',
      'It presses the string down onto the fingerboard to start it': 'The left hand’s fingers press the strings to choose the note; the bow sets them vibrating.',
    },
  },
  {
    id: 'vc.snd.2',
    page: 'sound',
    prompt: 'What carries the strings’ vibration into the cello’s body?',
    options: ['The f-holes, which the vibrating strings blow their air into', 'The bridge, rocking on its two feet as the strings pull it', 'The tailpiece, which shakes the end of the body'],
    correct: 'The bridge, rocking on its two feet as the strings pull it',
    explain: 'The strings pull the top of the bridge side to side; it rocks on its feet. One foot drives the top in and out; the other sits over the soundpost, which links the top to the back.',
    why: {
      'The f-holes, which the vibrating strings blow their air into': 'The f-holes let the air inside breathe in and out; the strings do not blow into them.',
      'The tailpiece, which shakes the end of the body': 'The tailpiece only anchors the strings. The bridge is what drives the top.',
    },
  },
  {
    id: 'vc.snd.3',
    page: 'sound',
    prompt: 'One of the string’s shapes has a still point right under the bow. What happens to that shape?',
    options: ['It becomes the loudest shape, because the bow presses right there', 'The bow cannot drive it there, so it is weak in the sound', 'Nothing changes: the bow drives all of the shapes the same'],
    correct: 'The bow cannot drive it there, so it is weak in the sound',
    explain: 'A point can only drive a shape as much as the string moves there in that shape. On a still point it cannot — so moving the bow along the string changes which shapes, and so which overtones, are strong.',
    why: {
      'It becomes the loudest shape, because the bow presses right there': 'The string does not move at a still point, so the bow cannot push that shape.',
      'Nothing changes: the bow drives all of the shapes the same': 'A shape is driven only where the string moves in it. On a still point, not at all.',
    },
  },
  hearingCheck('vc.set.1', W),
  {
    id: 'vc.set.2',
    page: 'setting',
    prompt: 'Where should a stand’s base and its cable go around a seated cellist?',
    options: ['Close in beside the endpin, where the floor space between the feet is clear', 'Across the front of the cello, the shortest route to the mic', 'Away from the endpin, the chair and the feet, outside the bow’s sweep'],
    correct: 'Away from the endpin, the chair and the feet, outside the bow’s sweep',
    explain: 'The endpin’s point, the chair legs and the feet share the floor, and the bow sweeps out to both sides. Route the cable away from them — and never across the front of the cello.',
    why: {
      'Close in beside the endpin, where the floor space between the feet is clear': 'The endpin and the feet move and slip; a stand or cable there can be kicked or caught.',
      'Across the front of the cello, the shortest route to the mic': 'A cable across the front can catch the bow or the instrument. Route it round, away from the player.',
    },
  },
  {
    id: 'vc.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you ask the cellist?',
    options: ['The make of their cello, to look up its one correct mic position', 'How they sit and sway, where the bow goes, the sound they want', 'Nothing: a starting point already says where the mic goes'],
    correct: 'How they sit and sway, where the bow goes, the sound they want',
    explain: 'A starting point is only valid if the cellist cannot hit the mic and still has room to move. Ask about the repertoire — sustained notes, pizzicato, loud passages — and hear the cello unamplified first.',
    why: {
      'The make of their cello, to look up its one correct mic position': 'No make sets a mic position. The player’s movement and the sound they want do.',
      'Nothing: a starting point already says where the mic goes': 'A starting point says where to begin — but only where the bow and the player cannot reach it.',
    },
  },
  {
    id: 'vc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic very close to where the bow meets the strings tends to hear more of…',
    options: ['The air breathing in and out of the f-holes in the low notes', 'The whole body and the room, blended together', 'The bow’s bite — rosin and hair at the start of notes'],
    correct: 'The bow’s bite — rosin and hair at the start of notes',
    explain: 'The bite starts where the hair grips the string, so a mic close to it hears more of it — and less of the whole body. A tendency, to check by ear.',
    why: {
      'The air breathing in and out of the f-holes in the low notes': 'That leaves from the f-holes, strongest in the low notes — a different place from the bow.',
      'The whole body and the room, blended together': 'That is what a farther mic tends to hear. Up close, one small region dominates.',
    },
  },
  {
    id: 'vc.mic.1',
    page: 'microphone',
    prompt: 'Why might a miniature on the strings suit a loud stage?',
    options: ['Its clip stops it from hearing the monitors and the rest of the stage', 'It stays at one distance from the strings as the cellist moves', 'It needs no power, so a spare input without phantom will do'],
    correct: 'It stays at one distance from the strings as the cellist moves',
    explain: 'Mounted on the strings below the bridge, the capsule moves with the cello, so the level and tone hold as the cellist sways — and close placement helps the cello against the stage. It still hears the monitors and the stage.',
    why: {
      'Its clip stops it from hearing the monitors and the rest of the stage': 'A clip is a mount, not a pattern: the mic still hears the stage — and the cello’s body reflects sound into it.',
      'It needs no power, so a spare input without phantom will do': 'A miniature condenser needs phantom power, through its adapter.',
    },
  },
  {
    id: 'vc.mic.2',
    page: 'microphone',
    prompt: 'The cello’s lowest note is about 65 Hz. What do you check?',
    options: ['Nothing: all microphones capture 65 Hz in the same way', 'That the mic and channel keep useful lows — then judge by ear', 'That the mic has a large diaphragm, since only large ones capture bass'],
    correct: 'That the mic and channel keep useful lows — then judge by ear',
    explain: 'Check the mic’s and the channel’s low end, and set any low-cut filter with the low C playing — then decide by the sound, not by a number on a sheet. Placement and the room matter as much.',
    why: {
      'Nothing: all microphones capture 65 Hz in the same way': 'Mics and filters differ in the lows; a filter set too high can thin the low C.',
      'That the mic has a large diaphragm, since only large ones capture bass': 'Diaphragm size does not decide low-frequency response; check the actual mic’s specifications and position.',
    },
  },
  {
    id: 'vc.mic.3',
    page: 'microphone',
    prompt: 'A cardioid very close to the cello makes the low strings boom. A likely reason?',
    options: ['The omni pattern is collecting the room’s bass', 'Proximity effect: a directional mic up close lifts the lows', 'The f-holes are aimed straight at the mic’s grille from close by'],
    correct: 'Proximity effect: a directional mic up close lifts the lows',
    explain: 'Directional mics lift the low end as they get close to a source. Back the mic off or change its angle before reaching for EQ — or try an omni, which has no proximity effect.',
    why: {
      'The omni pattern is collecting the room’s bass': 'The mic in the question is a cardioid. Close-up bass lift is a directional mic’s proximity effect.',
      'The f-holes are aimed straight at the mic’s grille from close by': 'An f-hole can add low-mid body, but the close-range lift of a cardioid is proximity effect.',
    },
  },
  {
    id: 'vc.mic.4',
    page: 'microphone',
    prompt: 'The cellist sits beside a drum kit; you aim a directional mic away from it. What can still happen?',
    options: ['Nothing: aiming away from the kit removes it from the mic completely', 'The cello’s body reflects the drums into the mic’s front', 'The mic hears only the back of the cello'],
    correct: 'The cello’s body reflects the drums into the mic’s front',
    explain: 'The cello’s large body is a reflective surface: sound from the kit or the PA can bounce off it into the front of a mic aimed away from them. Aim, distance and the players’ positions all play a part.',
    why: {
      'Nothing: aiming away from the kit removes it from the mic completely': 'Rejection is partial, and reflections off the cello arrive from the front.',
      'The mic hears only the back of the cello': 'A mic in front hears the top and the room — and whatever the body reflects.',
    },
  },
  {
    id: 'vc.place.1',
    page: 'placement',
    prompt: 'The starting point says “about 30 cm from the bridge”. Your readout says 30 cm from the top, lower down. Are you in it?',
    options: ['Yes: 30 cm is 30 cm, whatever part of the cello it is read from', 'Not necessarily — measure from the bridge, as the point names', 'Yes, as long as the mic is aimed at the cello'],
    correct: 'Not necessarily — measure from the bridge, as the point names',
    explain: 'A distance means something only with the part it is measured from. The same 30 cm from another part of the cello puts the mic somewhere else — which is why every readout names its reference.',
    why: {
      'Yes: 30 cm is 30 cm, whatever part of the cello it is read from': 'Same number, different place. The starting point is measured from the bridge.',
      'Yes, as long as the mic is aimed at the cello': 'Aim is a separate check. The distance is read from the part the starting point names.',
    },
  },
  {
    id: 'vc.place.2',
    page: 'placement',
    prompt: 'In a good room you move the mic from about 30 cm to about 1 m in front. What tends to change?',
    options: ['Only the level drops; the tone stays exactly the same', 'More of the whole cello and the room; less bow detail', 'More low end, because the mic is now farther away'],
    correct: 'More of the whole cello and the room; less bow detail',
    explain: 'A little more distance tends to blend the body, the strings and the room — and more of any neighbours. Compare at matched levels; cellos and rooms vary.',
    why: {
      'Only the level drops; the tone stays exactly the same': 'Distance changes the balance too: more body and room, less close detail, less proximity effect.',
      'More low end, because the mic is now farther away': 'With a directional mic, moving away reduces proximity effect’s low-end lift.',
    },
  },
  {
    id: 'vc.place.3',
    page: 'placement',
    prompt: 'Where does a cello miniature’s clip attach?',
    options: ['On the bridge itself, where the strings’ vibration is the strongest', 'Inside an f-hole, pressed against its edge', 'On the two outer strings below the bridge — not on the bridge'],
    correct: 'On the two outer strings below the bridge — not on the bridge',
    explain: 'A clip made for the cello grips the outer strings between the bridge and the tailpiece, and the gooseneck brings the capsule to its spot. Clamping the bridge can damp it — and a valuable cello needs the player’s agreement first.',
    why: {
      'On the bridge itself, where the strings’ vibration is the strongest': 'Hardware on the bridge can damp its vibration and risk the instrument. The clip grips the strings below it.',
      'Inside an f-hole, pressed against its edge': 'Nothing presses the f-hole edges or the varnish. Use the clip made for the cello.',
    },
  },
  {
    id: 'vc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a cello mic, its stand and its cable stay clear of?',
    options: ['The front of the cello, so the audience can see it', 'The music stand, so the cellist can read the part and the conductor', 'The bow’s sweep, the bow arm, the endpin and the feet'],
    correct: 'The bow’s sweep, the bow arm, the endpin and the feet',
    explain: 'Clearance comes first: both ends of the bow, the arm that moves it, and the floor around the endpin. Stop the cellist before anything moves, and check the full motion again.',
    why: {
      'The front of the cello, so the audience can see it': 'The front is where a stand mic usually goes. What must stay clear is what moves.',
      'The music stand, so the cellist can read the part and the conductor': 'Sight lines matter, but the safety question is what moves: the bow, the arm and the endpin area.',
    },
  },
  {
    id: 'vc.ctx.1',
    page: 'context',
    prompt: 'Feedback starts to ring on the cello’s mic. What is the first move?',
    options: ['Boost the cello channel so the note covers the ring', 'Ask the cellist to play louder, so the mic needs less gain to work', 'Lower the level, then change the mic, monitor and open mics'],
    correct: 'Lower the level, then change the mic, monitor and open mics',
    explain: 'Feedback is a sound-system condition: reduce the level at once, then revise the geometry — the mic, the wedge, the open mics. Never provoke it on purpose.',
    why: {
      'Boost the cello channel so the note covers the ring': 'More gain feeds the loop. Lower the level first.',
      'Ask the cellist to play louder, so the mic needs less gain to work': 'Feedback is the system’s to fix, not the player’s to cover.',
    },
  },
  superNull('vc.ctx.2', 'context', 'wedge'),
  {
    id: 'vc.ctx.studio',
    page: 'context',
    prompt: 'A solo cello in a good studio room. What could justify one farther mic and no close one?',
    options: ['A close mic would hear far more spill than a farther one', 'Close cello mics suit live work only, not a studio', 'The room adds to the sound, and nothing needs separating'],
    correct: 'The room adds to the sound, and nothing needs separating',
    explain: 'If the room is good and the cello plays alone, a farther mic can carry body, strings and space together. A close mic adds definition when the arrangement needs it.',
    why: {
      'A close mic would hear far more spill than a farther one': 'A close mic usually hears more cello relative to the rest, not less. The question is what the music needs.',
      'Close cello mics suit live work only, not a studio': 'Close mics are used in studios too — for a dense arrangement, say. It depends on the goal.',
    },
  },
  {
    id: 'vc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does most of the cello’s sound leave from?',
    options: ['Only the f-holes, which act as the cello’s built-in loudspeaker', 'The whole top and back, and the f-holes in the low notes', 'The scroll and the pegbox at the top of the neck'],
    correct: 'The whole top and back, and the f-holes in the low notes',
    explain: 'The top and back plates radiate, each part differently at each pitch, and air breathes through the f-holes. So a close mic hears its own slice — and no single f-hole is a full-cello spot.',
    why: {
      'Only the f-holes, which act as the cello’s built-in loudspeaker': 'The f-holes add low-mid air, but the plates radiate most of the sound.',
      'The scroll and the pegbox at the top of the neck': 'The neck and scroll radiate little. The body does the work.',
    },
  },
  {
    id: 'vc.two.1',
    page: 'twoMic',
    prompt: 'Why can a close and a farther mic on one cello sound thin together?',
    options: ['The farther mic inverts the sound on its way there, so it cancels', 'Two mics on one source cancel each other’s low end in the sum', 'The sound reaches them at different times, so some pitches cancel'],
    correct: 'The sound reaches them at different times, so some pitches cancel',
    explain: 'The farther mic hears each note a little later. Summed, some pitches arrive out of step and cancel — a comb of notches. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The farther mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one source cancel each other’s low end in the sum': 'Cancellation depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay('vc.two.2'),
  matchedLevels('vc.two.3'),
  {
    id: 'vc.two.4',
    page: 'twoMic',
    prompt: 'Does a solo cello need a second mic?',
    options: ['Yes: a single mic cannot record in stereo', 'Yes, one mic for the low C string and another one for the high A', 'Only for a reason — the room, a balance — and if it holds in mono'],
    correct: 'Only for a reason — the room, a balance — and if it holds in mono',
    explain: 'A strong single-mic sound is the reference. Add a second view for a stated goal, hear each alone and the pair in mono, and keep it only if it helps.',
    why: {
      'Yes: a single mic cannot record in stereo': 'Stereo is not a requirement for a solo cello — and the instrument is small enough to move the image as the player sways.',
      'Yes, one mic for the low C string and another one for the high A': 'Mics do not split strings: each hears the whole cello from its own place.',
    },
  },
  gainCheck('vc.prac.gain', W),
  {
    id: 'vc.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second cello channel?',
    options: ['Two channels give the mix engineer more options to choose from later on', 'The first mic works alone, the pair adds something, it holds in mono', 'The cello needs more level in the mix than one mic gives'],
    correct: 'The first mic works alone, the pair adds something, it holds in mono',
    explain: 'A second mic blends a different perspective — and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The cello needs more level in the mix than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'vc.mix.1',
    page: 'practice',
    prompt: 'A starting point reads “4–9 cm from the bridge’s foot, under the strings”. What is it measured from?',
    options: ['The top of the bridge, where the strings cross it', 'The fingerboard’s end, since it is the nearest part to the capsule', 'The bridge’s foot on the top, as the starting point names'],
    correct: 'The bridge’s foot on the top, as the starting point names',
    explain: 'A distance belongs to the part it names: from the foot, from the top of the bridge and from the fingerboard are different numbers for the same spot.',
    why: {
      'The top of the bridge, where the strings cross it': 'That is a different reference, nearly 9 cm higher on a cello.',
      'The fingerboard’s end, since it is the nearest part to the capsule': 'Nearest is not what the starting point names. Measure from the bridge’s foot.',
    },
  },
  nullOnPaper('vc.mix.2', 'wedge'),
  removeDelay('vc.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'vc.sym.weight',
    observation: 'The C string lacks weight',
    firstChecks: 'Mic angle, distance, the low-cut filter and the room; move or re-aim, and audition the filter with the low C playing.',
    options: ['Boost the low end on the channel before anything else', 'Swap to the largest mic you have, for its bigger diaphragm and bass', 'Angle, distance, the filter and the room — with the low C playing'],
    correct: 'Angle, distance, the filter and the room — with the low C playing',
    explain: 'A filter set too high, a mic off to one side or a room that cancels the lows can each thin the C string. Check them with the low C playing before reaching for EQ.',
    why: {
      'Boost the low end on the channel before anything else': 'EQ cannot put back what a filter or a cancellation removed. Find the cause first.',
      'Swap to the largest mic you have, for its bigger diaphragm and bass': 'Diaphragm size does not decide the lows. Placement, the filter and the room do.',
    },
  },
  {
    id: 'vc.sym.boom',
    observation: 'The C string booms on some notes',
    firstChecks: 'Close directional proximity effect, or a room mode: back off, change the height, or move the cello in the room.',
    options: ['Cut all the low end, so that no note can boom at all', 'Proximity or a room mode: back off, change height or position', 'Move the mic right up to an f-hole, where the low end is controlled'],
    correct: 'Proximity or a room mode: back off, change height or position',
    explain: 'A close directional mic lifts the lows, and a room can boost a few notes. Moving the mic or the cello usually fixes it better than a broad cut, which thins every note.',
    why: {
      'Cut all the low end, so that no note can boom at all': 'A broad cut thins every note to fix a few. Find the cause.',
      'Move the mic right up to an f-hole, where the low end is controlled': 'An f-hole adds low-mid body: it usually makes boom worse.',
    },
  },
  {
    id: 'vc.sym.scrape',
    observation: 'Bow scrape hides the pitch',
    firstChecks: 'The capsule is too close to the bow and the bridge: back away or change the angle.',
    options: ['Cut the high frequencies on the channel', 'Ask the cellist to use less rosin', 'Back the mic away or change its angle'],
    correct: 'Back the mic away or change its angle',
    explain: 'Very close to where the bow meets the strings, the mic hears the hair and rosin more than the note. A little more distance or a different angle blends them.',
    why: {
      'Cut the high frequencies on the channel': 'EQ dulls the cello along with the scrape. Move the mic first.',
      'Ask the cellist to use less rosin': 'The rosin is how the bow plays. The mic’s position is yours to change.',
    },
  },
  {
    id: 'vc.sym.sway',
    observation: 'The balance between strings changes as the cellist sways',
    firstChecks: 'The stand mic’s working zone is too narrow: reposition it, or try an approved miniature that moves with the cello.',
    options: ['Ask the cellist to sit completely still', 'Compress the channel hard until the level stops changing', 'Reposition the stand mic, or try an approved miniature'],
    correct: 'Reposition the stand mic, or try an approved miniature',
    explain: 'A seated cellist moves with the music. A slightly farther or wider view, or a miniature on the strings that moves with the cello, keeps the balance steadier.',
    why: {
      'Ask the cellist to sit completely still': 'Movement is part of playing. The mic setup should allow for it.',
      'Compress the channel hard until the level stops changing': 'Compression evens the level but not the changing tone. Fix the geometry.',
    },
  },
  {
    id: 'vc.sym.clip',
    observation: 'A clip buzzes, or the cable thumps',
    firstChecks: 'The mount or cable touches the cello or the chair: stop, remove and refit — with the cellist’s consent.',
    options: ['Stop, remove and refit it, with the cellist’s consent', 'Tape the cable to the cello so it cannot move', 'Gate the channel so the buzz drops out between the notes'],
    correct: 'Stop, remove and refit it, with the cellist’s consent',
    explain: 'A buzz means something touches where it should not. Stop, refit the clip as its maker intends, give the cable gentle strain relief away from the endpin and the chair, and recheck the full motion.',
    why: {
      'Tape the cable to the cello so it cannot move': 'Nothing goes on the varnish. Route and relieve the cable instead.',
      'Gate the channel so the buzz drops out between the notes': 'The buzz is on the instrument: hiding it does not stop it.',
    },
  },
  hollowSymptom('vc.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'vc.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic cello setup in the order you would do them.',
    steps: [
      { text: 'Ask the cellist: where they sit and sway, the bow’s reach, the sound wanted', early: 'Start with the player and the music.' },
      { text: 'Hear the cello unamplified in the room, low C to high A', early: 'Listen before choosing a mic.' },
      { text: 'Choose the mic and a stand or an approved clip', early: 'Choose once you know the player and the sound.' },
      { text: 'With the cellist stopped, place it about a foot from the bridge, clear of the bow', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on quiet AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare distance, height and angle one change at a time, matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand and cable; recheck the full bow and movement', early: 'Secure it last, then watch the player’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest passage.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'vc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud stage with a band. One channel for the cello, phantom power available; the cellist moves a lot with the music.',
    setups: [
      { id: 'a', label: 'Miniature clipped to the outer strings below the bridge, capsule under the strings toward the bridge', ok: true, power: 'phantom', feedback: 'A recommended starting point that moves with the cello and stays clear of the bow.' },
      { id: 'b', label: 'The same miniature, its capsule angled toward an f-hole, checked for feedback', ok: true, power: 'phantom', feedback: 'A recommended starting point: more level — check the tone and feedback with the monitors on.' },
      { id: 'c', label: 'Small condenser about a foot from the bridge, its stand clear of the bow', ok: false, power: 'phantom', feedback: 'A good studio starting point — but a cellist who moves a lot leaves its working zone on a loud stage.' },
      { id: 'd', label: 'A clip-on mic clamped to the bridge, for the strongest vibration', ok: false, power: 'phantom', feedback: 'Never clamp the bridge: it damps the instrument and risks it. Clip to the strings below it.' },
      { id: 'e', label: 'A mic pushed into the treble f-hole, for the most level', ok: false, power: 'phantom', feedback: 'Nothing goes into an f-hole: it presses on the instrument, and one hole is not the whole cello.' },
    ],
    reasons: [docReason('the bridge or the bridge’s foot'), clearReason('the bow’s sweep, the bow arm, the endpin and the feet'), POWER_REASON, { id: 'r.move', label: 'A mic that moves with the cello holds the sound as the player moves', role: 'optional', feedback: 'A fair live reason for a miniature on the strings.' }, BRAND_REASON('cello'), LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named part, clearance from the bow and the floor, and the power the mic needs.',
  },
  {
    id: 'vc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio. A string quartet is recorded with a main pair already up; the producer wants a little more cello definition.',
    setups: [
      { id: 'a', label: 'Small condenser about a foot from the bridge, raised gradually under the main pair, checked in mono', ok: true, power: 'phantom', feedback: 'A recommended starting point used as a spot: raised just enough, checked against the main pair.' },
      { id: 'b', label: 'Miniature on the outer strings below the bridge, at a modest level under the main pair', ok: true, power: 'phantom', feedback: 'A recommended starting point — a closer, more coloured spot; compare it with the main pair in mono.' },
      { id: 'c', label: 'Small condenser 2 m away, to match the main pair’s distance', ok: false, power: 'phantom', feedback: 'That adds room, not definition — the main pair already hears the cello from there.' },
      { id: 'd', label: 'Two close mics on the cello, one per side, to make it stereo', ok: false, power: 'phantom', feedback: 'A second close mic is not a stereo requirement, and it pulls the cellist forward out of the quartet.' },
      { id: 'e', label: 'A mic inside the f-hole, as close as it gets', ok: false, power: 'phantom', feedback: 'Nothing goes into an f-hole, and one opening is not the whole cello.' },
    ],
    reasons: [docReason('the bridge or the bridge’s foot'), clearReason('the bow, the bow arm, the endpin and the neighbours'), POWER_REASON, { id: 'r.mono', label: 'I will raise it gradually and check it with the main pair in mono', role: 'optional', feedback: 'A fair reason: a spot supports the main pair, it does not replace it.' }, BRAND_REASON('cello'), { id: 'r.stereo', label: 'A solo instrument needs its own stereo pair', role: 'wrong', feedback: 'Stereo is not a requirement for one cello inside an ensemble.' }],
    explain: 'Two spots pass. What passes is the reasoning: a sensible starting point, clearance, the right power — and a spot that supports the main pair rather than pulling one player forward.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: how does a bow keep a note going?', options: ['It strikes the string very fast', 'It grips the string, then lets it slip', 'It presses the string against the board'], after: 'Now STEP through (or PLAY ONCE) and watch the string, the bridge and the top.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from about a foot to a metre away, in a good room. What changes?', options: ['More bow detail', 'More of the whole cello and the room', 'It depends on this cello'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the cellist. Where will a supercardioid aimed at the cello reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What carries the strings’ vibration into the cello’s body?',
    options: ['The bridge, standing on the top', 'The endpin, resting on the floor', 'The tailpiece, at the end'],
    correct: 'The bridge, standing on the top',
    explain: 'The strings cross the bridge, and the bridge stands on the top: it passes their vibration into the body.',
    why: {
      'The endpin, resting on the floor': 'The endpin holds the cello up; it does not carry the strings’ vibration in.',
      'The tailpiece, at the end': 'The tailpiece anchors the strings behind the bridge.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Which part should never have a mic or clip clamped to it?',
    options: ['A stand beside the cello', 'The bridge', 'The two outer strings below the bridge'],
    correct: 'The bridge',
    explain: 'Hardware on the bridge can damp its vibration and risk the instrument; a clip made for the cello grips the strings below it instead.',
    why: {
      'A stand beside the cello': 'A stand beside the cello is fine, clear of the bow and the endpin.',
      'The two outer strings below the bridge': 'That is where a cello clip is made to attach — with the player’s agreement.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'How does a bow keep a note sounding?',
    options: ['It grips the string, then lets it slip back, every cycle', 'It strikes the string again and again, very fast, like a hammer', 'It holds the string still against the fingerboard'],
    correct: 'It grips the string, then lets it slip back, every cycle',
    explain: 'Grip and slip, once every vibration: the bow feeds the string as long as it moves.',
    why: {
      'It strikes the string again and again, very fast, like a hammer': 'A bow never strikes. It grips and lets go.',
      'It holds the string still against the fingerboard': 'The left hand stops the string; the bow sets it vibrating.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic far in front of the cello, compared with one close to the bow, tends to hear…',
    options: ['More of the whole body and the room', 'More of the bow’s rosin and hair', 'Nothing of the low strings at that distance'],
    correct: 'More of the whole body and the room',
    explain: 'Distance blends the plates, the f-holes and the room; close up, one region — and the bow — dominate.',
    why: {
      'More of the bow’s rosin and hair': 'That is what a close mic near the bow tends to hear.',
      'Nothing of the low strings at that distance': 'A farther mic still hears the low strings — usually with the room around them.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand mic and its cable stay clear of around a seated cellist?',
    options: ['The bow’s sweep, the bow arm, the endpin and the feet', 'The music stand, so the player can read the music', 'The audience’s view of the instrument and the player'],
    correct: 'The bow’s sweep, the bow arm, the endpin and the feet',
    explain: 'Clearance comes first: whatever moves — the bow at both ends, the arm, the feet — and the endpin’s point on the floor.',
    why: {
      'The music stand, so the player can read the music': 'Sight lines matter, but safety is about what moves.',
      'The audience’s view of the instrument and the player': 'The view matters less than the player’s movement.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the cellist’s floor wedge, in front and a little to their right, facing back',
    short: 'WEDGE',
    p: { x: 1200, y: POSTURE.floorY, z: 600 },
    lift: 150,
    faces: { x: -0.89, y: 0, z: -0.45 },
    note: 'On the floor in front, facing back at the cellist: below and behind a mic aimed back at the cello — the case a pattern’s rejection can help with, tilting as well as turning.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the cellist’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: POSTURE.floorY, z: -1100 },
    lift: 150,
    faces: { x: -0.6, y: 0, z: 0.8 },
    note: 'Off to one side, facing another player: well off the mic’s axis — and the cello’s body can still reflect some of it into the mic.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const C09C_LESSON: Lesson = {
  id: 'C09c',
  labId: 'strings',
  title: 'Cello',
  subtitle: 'A foot from the bridge, a farther view, or a clip on the strings',
  noun: { one: 'cello', many: 'cellos' },
  model: CELLO_MODEL,
  micTypeIds: ['sdcCard', 'strMini'],
  zones: CELLO_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The cello is the large bowed string instrument played seated, held between the knees with its endpin on the floor. Four strings — C, G, D, A — run from the tailpiece over a thin bridge to the scroll. The bow, or a plucking finger, sets them vibrating; the bridge passes that into the hollow wooden body.', src: 'DPA-VC' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras and string quartets, solo recitals, studio sessions and film scores — and more and more in pop, folk and jazz on stage. This lesson covers one cello, bowed and plucked, in the studio, as a spot in an ensemble, and live.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It carries bass lines and melodies alike: the low C string gives weight under an ensemble, the A string sings. Ask the cellist what the part needs — long notes, pizzicato, fast passages — because that decides how much bow and how much body the mic should catch.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A full-size cello’s body is about 75 cm long, about 1.2 m with the neck and scroll. Its lowest note, the open C, is about 65 Hz. This lab draws a cello about that size, played seated, leaning back toward the player.', src: 'MET-VUILL' },
  ],
  sound: {
    stages: [
      { title: 'The bow grips the string', text: 'Rosin on the bow hair grips the string and drags it sideways with the bow — a little way, many times larger here than it really moves.' },
      { title: 'The string slips back', text: 'When the string’s pull gets stronger than the grip, it slips back past its resting place, and the hair catches it again. Grip and slip repeat once every vibration: that is how a bow keeps a note going.' },
      { title: 'The string rocks the bridge', text: 'The vibrating strings pull the top of the bridge from side to side, and the bridge rocks on its two feet.' },
      { title: 'The bridge drives the top', text: 'Under one foot the top moves in and out; under the other, a small wooden post inside — the soundpost — holds the top nearly still and passes the motion to the back. The top, the back and the air inside all vibrate.' },
      { title: 'Sound leaves the body', text: 'Sound leaves from the whole top and back, and air breathes in and out of the f-holes, strongest in the low notes. Different pitches leave in different directions, so a close mic hears its own slice of the cello.' },
    ],
    attack: 'The start of a note: the bow catching the string — a little rosin and hair, the “bite” — or a finger’s pluck. It starts at the string, so a mic close to the bow and the bridge tends to hear more of it.',
    body: 'The sustained tone: the strings, the bridge, the top and back and the air inside ringing together, leaving from the whole body and the f-holes. A mic farther away tends to hear more of the whole instrument and the room. Both are tendencies, and cellos vary.',
    head: { diameterMm: 0, rods: 0, label: 'the C string', strikeSrc: 'PHYS-ET' },
  },
  setting: {
    items: [
      { id: 'cello', label: 'the cello and the cellist', short: 'CELLO', note: 'The cellist sits on a firm chair, the cello leaning back against the chest, knees beside the lower bouts. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'cello/GEOMETRY_PROPOSAL.md §1 (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'bow', label: 'the bow’s sweep', short: 'BOW', note: 'The bow crosses the strings below the fingerboard and travels its whole length both ways — out to the cellist’s right at the tip of a stroke, to the left at the frog. No mic, stand or cable goes in its path.', prov: { kind: 'illustrative', reason: 'violin/GEOMETRY_PROPOSAL.md §3 bow envelope' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'endpin', label: 'the endpin and the feet', short: 'ENDPIN', note: 'The endpin’s point holds the cello on the floor, between the cellist’s feet. Keep stand bases and cables well away from it — a stand that tips or a cable that tugs can move a cello.', prov: { kind: 'illustrative', reason: 'cello proposal: a 150 mm keep-out round the tip' }, tag: 'KEEP CLEAR', scene: 'kit' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the cellist, a little to the side. The cellist must see the music and the conductor or the other players: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'cello proposal: music stand 600 in front (drawing default)' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'viola', label: 'the viola beside the cello', short: 'VIOLA', note: 'In a quartet the viola sits close by. A cello mic hears it too: aim, pattern and distance decide how much.', prov: { kind: 'illustrative', reason: 'a typical quartet seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'violin', label: 'a violin across the group', short: 'VIOLIN', note: 'Farther away, but still heard — and the cello’s large body can reflect other instruments into its own mic.', prov: { kind: 'illustrative', reason: 'a typical quartet seating' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the cellist’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front of the cellist, facing back at them — loud, and close to a cello mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic cello; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the ensemble', short: 'MAIN PAIR', note: 'In a studio recording of a group, a main pair on a tall stand hears the whole ensemble; a cello mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair; seating is the ensemble lesson’s' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges on the floor; a good room is part of the cello’s sound.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and neighbours and the PA reach every open mic. Gain before feedback and the cellist’s movement push toward a closer, aimed pickup — or a miniature that moves with the cello.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the cellist stops. A farther mic can carry the whole cello and the room; in a group, a main pair may carry it already.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic cello setup for a given room and performance, describe an alternative position, and explain what would justify a second mic. With a real cello and the cellist’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from the bridge (or which part)', kind: 'text' },
      { id: 'aim', label: 'Aim, and where the monitors sit off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The cello’s height above the floor (endpin 300 mm, a 25° lean and a 6° lean to the player’s left — drawing defaults) — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'Rib height (120 mm), stop (400), string length (690), bridge height and width (90 × 90), arching, the fingerboard and the bow length (715) — drawing defaults; the body size is a museum cello used as a modern size.', dims: [] },
    { text: 'The bow’s sweep (±25° for the string crossings, the stick and hair drawn 25 mm thick), the bow hand, the bow arm and the left hand — illustrative envelopes.', dims: [] },
    { text: 'The cellist’s body, the chair (seat 460 mm) and where the player sits — drawn from the instrument (knees at the lower bouts, chest at the upper back).', dims: [] },
    { text: 'The stand mic’s distance band round “one foot” (25–35 cm), the far band (0.6–1.2 m) and the clip zones’ distances — drawing defaults.', dims: [] },
    { text: 'The miniature’s capsule size and gooseneck reach, and the small condenser’s diameter — drawing defaults.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every cello, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one cellist in a typical posture, the bow’s sweep as a hatched area, mic patterns and the two-mic comb as textbook shapes, and string and body motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the cellist stopped, and only with their agreement.',
  copy: CELLO_COPY,
};
