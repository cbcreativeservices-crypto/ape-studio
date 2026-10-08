/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B02-News-Anchors-and-Seated-Interviews-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7G2") applied — the institutional wording (B-INST:
 * L2, L42, L43) and no links to unbuilt lessons (B-XLINK: L88's lesson list;
 * the headset idea of L11 is said in words). The lav distance is the D-LAV1
 * union band (one device's 25 cm, the sternum trial).
 *
 * An anchor and a guest seated at a desk, the SHOT as the variant (CLOSE /
 * TWO-SHOT / PUBLIC), on the shared seated talker, the desk and its
 * reflection (group 1), the camera frame, the fixed boom and the body-worn
 * mount points (group 2). Safety exact, in plain words: consent and
 * wardrobe, skin-safe adhesive only on skin, no bodypack lav into 48 V
 * phantom except through its adapter, overhead booms rigged by qualified
 * crew before anyone sits beneath, never provoke feedback.
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { SEATED_FLOOR } from '../shared/broadcast/talkerPose.ts';
import { B02_MODEL, PA_C } from './geometry.ts';
import { B02_ZONES } from './model.ts';
import { B02_COPY } from './copy.ts';

const W: Words = { noun: 'anchor', player: 'anchor', moving: 'the head, the hands and the papers' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the anchor and the desk',
    goal: 'Get to know a seated anchor and a guest on camera — where the voice leaves, the chest a lav clips to, the desk under the mouth, the camera and its frame — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; the desk, the turns of the head, the guest and the camera’s frame decide what else a mic hears and where it may go.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the anchor, what a turn and reading down do to a lav, a boom and a desk mic, how the frame sets the boom’s distance, how the desk sends a later copy, and what a second open lav hears.',
    credit: { scenarios: ['b2.snd.1', 'b2.snd.2', 'b2.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every mic here stays put while the mouth turns. The frame sets how close a boom may come; a raised desk mic hears the desk’s copy; each open lav hears the other voice later. Tendencies, and sets vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each mic goes — the program, the recorder, the earpiece, a public PA — and what to settle first: the shot and the moves, consent and wardrobe, safe rigging and power, and a live check without feedback.',
    credit: { scenarios: ['b2.set.1', 'b2.set.2', 'b2.set.3', 'b2.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Ask for the widest frame, ask the person and wardrobe first, rig an overhead boom with qualified crew, give each speaker their own channel, keep one mic on air per voice, and bring live mics up to their working level only.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose an anchor’s mic by the shot, the movement and the route: a visible or hidden lav, a boom outside the frame, a gooseneck or a boundary mic on the desk.',
    credit: { scenarios: ['b2.mic.1', 'b2.mic.2', 'b2.mic.3', 'b2.mic.4', 'b2.rec.1'], note: 'Answer the five checks (one reaches back to the anchor and the desk).' },
    takeaway: 'A centred lav is a reliable first trial; hide it only after the visible place works; a boom avoids the clothes but must stay outside the frame; a desk mic avoids the clothes but meets the papers and the desk’s bounce.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a lav on the anchor’s sternum — then try a hidden lav, a boom outside the frame, a desk mic, and see what changes.',
    credit: { scenarios: ['b2.place.1', 'b2.place.2', 'b2.place.3', 'b2.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. Where the mic is, its distance and its angle off the mouth are separate controls; consent, the picture and the clothes come first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a desk gooseneck so its rejection faces a public interview’s PA — and know why a news set and a public interview call for different checks.',
    credit: { scenarios: ['b2.ctx.1', 'b2.ctx.2', 'b2.ctx.studio', 'b2.rec.3'], interactive: 'wedgeInNull', note: 'PUBLIC: aim the gooseneck (or change its pattern) until the PA sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A news set may not reinforce the anchor; a public interview can — then every open mic hears the PA. Closer mics, the fewest open, and the rejection toward the loudspeaker.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a boom and a lav summed on the anchor can sound hollow, how the arrival-time difference places comb notches, and why one is chosen for the program.',
    credit: { scenarios: ['b2.two.1', 'b2.two.2', 'b2.two.3', 'b2.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The lav hears the voice first, the boom later: summed, some pitches cancel. Use the intended channel, keep a tested fallback on its own track; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the clothes, the cable, the turn, the desk and its papers, the frame, the open mics, the route — before reaching for EQ or noise reduction.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up an anchor’s mic in the right order, choose and justify a setup for a recorded interview and a public one, and say what would justify a second mic.',
    credit: { scenarios: ['b2.prac.order', 'b2.prac.gain', 'b2.prac.setup1', 'b2.prac.setup2', 'b2.prac.3', 'b2.mix.1', 'b2.mix.2', 'b2.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement sheet is optional — it needs a real set.' },
    takeaway: 'Consent, a centred place measured from the lips, a channel for each speaker, one mic on air per voice and a tested fallback pass. A brand, a hidden mic for its own sake or a “hotter” signal do not — and more than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the anchor and the guest');

/*
 * THE CHECKS. Lesson lines in comments only: b2.snd.* L6–L7, L29–L31 ·
 * b2.set.* L9, L12, L15, L34 · b2.mic.* L8–L13, L23–L27 · b2.place.* L8–L13,
 * L15 · b2.ctx.* L34 · b2.two.* L17, L33 · b2.prac.* / b2.mix.* L36–L42.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b2.snd.1',
    page: 'sound',
    prompt: 'The anchor turns from the camera to the guest. What happens at the lav?',
    options: ['It stays put; the mouth turns away from it', 'It turns with the anchor’s head toward the guest', 'It comes closer to the mouth as the head turns'],
    correct: 'It stays put; the mouth turns away from it',
    explain: 'A lav is on the chest. The head turns about its centre, so the mouth moves off the lav’s line — a centred lav changes alike for a turn either way.',
    why: {
      'It turns with the anchor’s head toward the guest': 'Only a headset turns with the head. A lav moves with the chest.',
      'It comes closer to the mouth as the head turns': 'The mouth swings sideways, away from the middle of the chest.',
    },
  },
  {
    id: 'b2.snd.2',
    page: 'sound',
    prompt: 'A raised gooseneck over a hard desk. What does the desk add?',
    options: ['A later copy that cancels some pitches', 'More low end, because the desk resonates', 'Nothing, since the desk is below the mouth'],
    correct: 'A later copy that cancels some pitches',
    explain: 'The voice reaches the mic straight and, a little later, off the desk. Summed, some pitches cancel. Nearer the mouth and higher off the desk, the copy is later and weaker.',
    why: {
      'More low end, because the desk resonates': 'The main effect is the reflection’s later copy, not a resonance.',
      'Nothing, since the desk is below the mouth': 'A hard desk reflects the voice up into a raised mic.',
    },
  },
  {
    id: 'b2.snd.3',
    page: 'sound',
    prompt: 'The anchor’s and the guest’s lavs are both open. What does the anchor’s lav hear?',
    options: ['The guest too, later and lower', 'Only the anchor, since it is omni', 'The guest louder than the anchor'],
    correct: 'The guest too, later and lower',
    explain: 'An omni lav hears all round. The guest is farther away: their voice arrives lower and later. Summed with the guest’s own lav, it combs.',
    why: {
      'Only the anchor, since it is omni': 'An omni hears from every side — the guest included.',
      'The guest louder than the anchor': 'The anchor is much closer to their own lav.',
    },
  },
  voiceRatingCheck('b2.set.1', 'the anchor'),
  {
    id: 'b2.set.2',
    page: 'setting',
    prompt: 'Wardrobe is busy; the anchor’s blouse needs a small cut to hide the lav. What then?',
    options: ['Wait for wardrobe and the anchor to agree', 'Cut it carefully; it is only a small slit', 'Tape the lav to the skin under the blouse'],
    correct: 'Wait for wardrobe and the anchor to agree',
    explain: 'Never cut, pierce or tape into clothes without wardrobe’s approval and the anchor’s agreement. Use a visible lav meanwhile.',
    why: {
      'Cut it carefully; it is only a small slit': 'Any change to a garment needs wardrobe’s and the wearer’s agreement.',
      'Tape the lav to the skin under the blouse': 'Skin needs the wearer’s agreement and an adhesive made for skin.',
    },
  },
  {
    id: 'b2.set.3',
    page: 'setting',
    prompt: 'A fixed boom will hang above the guest’s seat. When may the guest sit?',
    options: ['When qualified crew have rigged and secured it', 'Once the boom is roughly in its place above them', 'As soon as the mic is plugged in and working'],
    correct: 'When qualified crew have rigged and secured it',
    explain: 'An overhead boom is rigged and secured by qualified crew before anyone sits beneath it — the stand, the arm, the clamp and the cable.',
    why: {
      'Once the boom is roughly in its place above them': 'Roughly placed is not secured. Wait for the crew.',
      'As soon as the mic is plugged in and working': 'A plugged-in mic says nothing about the rigging.',
    },
  },
  {
    id: 'b2.set.4',
    page: 'setting',
    prompt: 'The anchor’s lav carries the program. Where does the boom go as a fallback?',
    options: ['Its own track, ready to switch to', 'Summed into the program, a bit lower', 'Into the earpiece, as a check'],
    correct: 'Its own track, ready to switch to',
    explain: 'A fallback is a second, checked mic on its own track with a clear cue to switch. Summed with the lav it combs.',
    why: {
      'Summed into the program, a bit lower': 'Lower or not, it is a second open mic on one voice.',
      'Into the earpiece, as a check': 'The earpiece carries cues and the program, not a spare mic.',
    },
  },
  {
    id: 'b2.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why does a centred lav suit an anchor who turns both ways?',
    options: ['Turns left and right read alike', 'It turns with the head as it moves', 'Closest to the mouth of all the places'],
    correct: 'Turns left and right read alike',
    explain: 'On the middle line, a turn to either side moves the mouth the same way relative to the lav: no one side is quieter.',
    why: {
      'It turns with the head as it moves': 'A lav stays on the chest; only a headset turns.',
      'Closest to the mouth of all the places': 'A collar or neckline is closer; the centre is about balance.',
    },
  },
  {
    id: 'b2.mic.1',
    page: 'microphone',
    prompt: 'When should a lav be hidden rather than visible?',
    options: ['When the shot needs it, after a visible test', 'Hidden first, since it looks better on camera', 'Not at all — a hidden lav is unusable'],
    correct: 'When the shot needs it, after a visible test',
    explain: 'Conceal only after the visible position works, and compare: cloth over a capsule can dull and rub. Keep the visible lav or a boom ready.',
    why: {
      'Hidden first, since it looks better on camera': 'Hidden first skips the check that the place works at all.',
      'Not at all — a hidden lav is unusable': 'A hidden lav can work, with a mount made for that model and a careful test.',
    },
  },
  {
    id: 'b2.mic.2',
    page: 'microphone',
    prompt: 'What makes a boundary mic different from a lav taped flat to the desk?',
    options: ['Its element is built to sit at the surface', 'Its capsule is far larger than a lav’s', 'It faces up toward the anchor’s mouth'],
    correct: 'Its element is built to sit at the surface',
    explain: 'A purpose-built boundary mic places its element right at the surface with a designed opening; a lav taped down is not the same mic.',
    why: {
      'Its capsule is far larger than a lav’s': 'Size is not the point: a boundary mic is designed for the surface; a lav is not.',
      'It faces up toward the anchor’s mouth': 'A taped lav can face up too: its facing does not make it a boundary design.',
    },
  },
  {
    id: 'b2.mic.3',
    page: 'microphone',
    prompt: 'What does a boom outside the frame avoid that a lav meets?',
    options: ['Clothing noise from the garments', 'The camera’s frame and its edges', 'The room and its reflections'],
    correct: 'Clothing noise from the garments',
    explain: 'A boom hears no jacket, tie or cable — but it must stay outside every frame, and it hears more of the room.',
    why: {
      'The camera’s frame and its edges': 'The frame is the boom’s main limit.',
      'The room and its reflections': 'A boom farther away hears more of the room, not less.',
    },
  },
  {
    id: 'b2.mic.4',
    page: 'microphone',
    prompt: 'The anchor sounds distant on the boom’s shotgun. What brings the voice closer?',
    options: ['Moving the boom nearer, to the frame’s edge', 'A longer tube, which reaches farther', 'Aiming the tube more precisely at the mouth'],
    correct: 'Moving the boom nearer, to the frame’s edge',
    explain: 'Directional rejection cannot restore the voice-to-room balance lost to distance. Bring the boom as close as the frame allows.',
    why: {
      'A longer tube, which reaches farther': 'The tube narrows the highs; it does not reach farther.',
      'Aiming the tube more precisely at the mouth': 'Aim keeps it on the voice; it does not shorten the distance.',
    },
  },
  {
    id: 'b2.place.1',
    page: 'placement',
    prompt: 'A lav starting point says “12–25 cm”. Measured from where?',
    options: ['The lips, to the capsule’s front', 'The desk top, to the clip on the shirt', 'The collar, to the pack on the belt'],
    correct: 'The lips, to the capsule’s front',
    explain: 'The voice leaves at the mouth, so every distance here starts at the lips and ends at the capsule.',
    why: {
      'The desk top, to the clip on the shirt': 'The desk is not where the voice leaves; measure from the lips.',
      'The collar, to the pack on the belt': 'The pack transmits; the capsule hears. Measure lips to capsule.',
    },
  },
  {
    id: 'b2.place.2',
    page: 'placement',
    prompt: 'The camera goes to a two-shot. What happens to the boom’s place?',
    options: ['It moves farther away', 'It can come closer now', 'Nothing — the frame did not change'],
    correct: 'It moves farther away',
    explain: 'The wider frame’s top is higher: the boom stays just outside it, farther from the mouth — more room against the voice.',
    why: {
      'It can come closer now': 'A wider picture leaves less room, not more.',
      'Nothing — the frame did not change': 'The two-shot is a wider frame: its edges moved out.',
    },
  },
  {
    id: 'b2.place.3',
    page: 'placement',
    prompt: 'A gooseneck on the desk: a fair first place for its capsule?',
    options: ['Raised toward the mouth, a little below it', 'Low over the desk, aimed at the chest', 'Level with the eyes, aimed at the forehead'],
    correct: 'Raised toward the mouth, a little below it',
    explain: 'Raised, it is closer to the mouth and away from the desk’s activity and bounce; a little below the mouth’s line keeps it out of the eyeline and the breath.',
    why: {
      'Low over the desk, aimed at the chest': 'Low over the desk hears the bounce and the papers; the chest is not where the voice leaves.',
      'Level with the eyes, aimed at the forehead': 'Aim at the mouth, and keep out of the eyeline.',
    },
  },
  {
    id: 'b2.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Why can a raised desk mic sound hollow?',
    options: ['The desk sends a later copy of the voice', 'The desk soaks up the voice’s high end', 'The anchor talks more quietly when it is near'],
    correct: 'The desk sends a later copy of the voice',
    explain: 'The direct voice and its later copy off the desk add up: some pitches cancel. A boundary mic on the desk hears the two arrive together.',
    why: {
      'The desk soaks up the voice’s high end': 'A hard desk reflects; the problem is the later copy.',
      'The anchor talks more quietly when it is near': 'The anchor’s voice does not change; the reflection does the colouring.',
    },
  },
  {
    id: 'b2.ctx.1',
    page: 'context',
    prompt: 'A public interview with a PA. A fair step for the desk mics?',
    options: ['Close mics, the fewest open, rejection to the PA', 'Each mic left open so that nothing is missed', 'The boundary turned up to cover the whole desk'],
    correct: 'Close mics, the fewest open, rejection to the PA',
    explain: 'Every open mic hears the PA. Close mics keep the voices ahead; the fewest open keep the margin; aim each pattern’s rejection at the loudspeaker.',
    why: {
      'Each mic left open so that nothing is missed': 'Each open mic lowers the margin before feedback.',
      'The boundary turned up to cover the whole desk': 'A distant boundary hears the PA and the room; more gain brings feedback closer.',
    },
  },
  {
    id: 'b2.ctx.2',
    page: 'context',
    prompt: 'Where should the PA sit for a supercardioid gooseneck’s most rejection?',
    options: ['Off to the rear, near 125° from the front', 'Directly in front of the gooseneck’s capsule', 'At its side, square to its front at 90°'],
    correct: 'Off to the rear, near 125° from the front',
    explain: 'A supercardioid rejects most about 125° off its front, with a small lobe straight behind. Aim by the actual pattern — and a real null is shallower than the drawing.',
    why: {
      'Directly in front of the gooseneck’s capsule': 'In front is its pickup, not its rejection.',
      'At its side, square to its front at 90°': 'At 90° it still hears well; the deepest dip lies farther round.',
    },
  },
  {
    id: 'b2.ctx.studio',
    page: 'context',
    prompt: 'A recorded news interview, no loudspeakers, a two-shot. A fair first setup?',
    options: ['A lav each, on separate channels', 'One boundary between them for both', 'The camera’s mic for both voices'],
    correct: 'A lav each, on separate channels',
    explain: 'With no PA, a centred lav each on labelled channels gives level and routing control; a boom outside the frame can carry the program with the lavs as fallbacks.',
    why: {
      'One boundary between them for both': 'Shared and far from both mouths: less control, more room and papers.',
      'The camera’s mic for both voices': 'As far as the camera: the room comes up with the voices.',
    },
  },
  {
    id: 'b2.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The anchor reads down. Which mic keeps its distance to the mouth?',
    options: ['None of these — the mouth moves', 'The fixed boom above the camera’s frame', 'The gooseneck on the desk'],
    correct: 'None of these — the mouth moves',
    explain: 'A lav, a boom and a desk mic all stay where they are while the head tips: each one’s distance and angle change. Only a headset moves with the head.',
    why: {
      'The fixed boom above the camera’s frame': 'It is fixed: the mouth tips away from it.',
      'The gooseneck on the desk': 'It stays on the desk: the mouth tips toward or away from it.',
    },
  },
  {
    id: 'b2.two.1',
    page: 'twoMic',
    prompt: 'The boom and the lav summed on the anchor sound hollow. Why?',
    options: ['The voice reaches the lav first, the boom later', 'The boom reverses the voice’s polarity', 'The lav is louder, so it simply cancels the boom'],
    correct: 'The voice reaches the lav first, the boom later',
    explain: 'Two arrival times of one voice, summed: some pitches arrive out of step and cancel — a comb.',
    why: {
      'The boom reverses the voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The lav is louder, so it simply cancels the boom': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b2.two.2'),
  {
    id: 'b2.two.3',
    page: 'twoMic',
    prompt: 'The guest is listening for a while. Their lav channel?',
    options: ['Muted until they speak, as the format allows', 'Left open all the time, for the room’s sound', 'Turned up a little so that they are ready'],
    correct: 'Muted until they speak, as the format allows',
    explain: 'An unused open lav only adds the anchor’s voice later, the room and the guest’s papers. Mute it; check that a soft first word is not lost.',
    why: {
      'Left open all the time, for the room’s sound': 'The open lav adds a late copy of the anchor and the papers, not useful room.',
      'Turned up a little so that they are ready': 'More gain on an unused mic adds bleed and noise.',
    },
  },
  {
    id: 'b2.two.4',
    page: 'twoMic',
    prompt: 'Two unchecked mics on the anchor, both open in the program. Is that a backup?',
    options: ['No — a backup is checked on its own', 'Yes — two mics are safer than one', 'It is, if both are the same model'],
    correct: 'No — a backup is checked on its own',
    explain: 'A fallback is a second mic checked on its own track, with a clear cue for switching. Two unverified mics are not redundancy — and both open, they comb.',
    why: {
      'Yes — two mics are safer than one': 'Unchecked, both may fail — and open together on one voice, they comb.',
      'It is, if both are the same model': 'A matching model can fail the same way; unchecked, it proves nothing.',
    },
  },
  {
    id: 'b2.prac.gain',
    page: 'practice',
    prompt: 'The anchor’s emphatic line clips the lav’s transmitter. What do you do?',
    options: ['Lower the transmitter’s gain and check again', 'Pull the channel fader down at the mixing desk', 'Ask the anchor to read more quietly'],
    correct: 'Lower the transmitter’s gain and check again',
    explain: 'Set gain on normal and emphatic speech, with headroom at the transmitter and every stage after. A lower fader does not undo clipping before it.',
    why: {
      'Pull the channel fader down at the mixing desk': 'The clip is at the transmitter: the fader only makes it quieter.',
      'Ask the anchor to read more quietly': 'Set gain for how they really read.',
    },
  },
  {
    id: 'b2.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on the anchor?',
    options: ['A tested fallback, on its own track', 'A fuller voice from two mics summed', 'More level than one mic gives'],
    correct: 'A tested fallback, on its own track',
    explain: 'A boom as the program with the lav as its fallback — or the reverse — each on its own track, switched with a clear cue. Summed, they comb.',
    why: {
      'A fuller voice from two mics summed': 'Two copies of one voice usually sound hollower.',
      'More level than one mic gives': 'Level comes from gain and closeness, not another mic.',
    },
  },
  {
    id: 'b2.mix.1',
    page: 'practice',
    prompt: 'Rustling every time the anchor turns a page. A first idea to try?',
    options: ['Check the jacket on the lav and the papers’ place', 'Cut the high end hard on the anchor’s channel later', 'Ask the anchor to stop turning the pages'],
    correct: 'Check the jacket on the lav and the papers’ place',
    explain: 'Find the contact: a lapel brushing the capsule, the cable on a seam, papers near a desk mic. Fix the place before any EQ or denoising.',
    why: {
      'Cut the high end hard on the anchor’s channel later': 'A cut dulls the voice and leaves the rustle.',
      'Ask the anchor to stop turning the pages': 'The script is part of the program; fix the mic’s place.',
    },
  },
  {
    id: 'b2.mix.2',
    page: 'practice',
    prompt: 'The boom shows in the top of the two-shot. A first idea to try?',
    options: ['Raise it just outside the wider frame', 'Ask the camera to keep the close shot', 'Swap it for a longer shotgun higher up'],
    correct: 'Raise it just outside the wider frame',
    explain: 'The two-shot’s frame is higher: the boom goes just outside it — farther from the mouth. Check the widest frame before every take.',
    why: {
      'Ask the camera to keep the close shot': 'The shot is the program’s decision; the boom works round it.',
      'Swap it for a longer shotgun higher up': 'A longer tube does not bring the voice closer.',
    },
  },
  removeDelayVoice('b2.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b2.sym.rub',
    observation: 'Brushing and scratching on the anchor’s lav',
    firstChecks: 'Is the jacket, a tie, hair, jewellery or the earpiece cable touching the capsule? Is the cable on a moving seam?',
    options: ['Clear the capsule; move it or reroute the cable', 'Add noise reduction to the anchor’s channel later on', 'Clip the lav lower down, under the tie'],
    correct: 'Clear the capsule; move it or reroute the cable',
    explain: 'Brushing is contact. Clear the capsule from the cloth, keep the cable off moving seams and secure it in more than one place — before any EQ or denoising.',
    why: {
      'Add noise reduction to the anchor’s channel later on': 'Processing cannot cleanly remove a rub mixed with the voice.',
      'Clip the lav lower down, under the tie': 'Lower and under the tie adds cloth, not less.',
    },
  },
  {
    id: 'b2.sym.turn',
    observation: 'The anchor sounds duller when turned to the guest',
    firstChecks: 'Is the lav off to the far side? Is a fixed boom or a desk mic aimed where the anchor faced the camera?',
    options: ['Centre the lav; re-aim or cue the fixed mic', 'Turn the anchor’s channel up a little for the turns', 'Ask the anchor to face the camera to talk'],
    correct: 'Centre the lav; re-aim or cue the fixed mic',
    explain: 'Each mic here stays put while the mouth turns. A centred lav reads both turns alike; a boom or a desk mic is aimed for the real turns, or the guest gets the line.',
    why: {
      'Turn the anchor’s channel up a little for the turns': 'Gain raises the room with the voice and does not follow the turn.',
      'Ask the anchor to face the camera to talk': 'The interview needs them to turn; place the mics for it.',
    },
  },
  {
    id: 'b2.sym.hollowdesk',
    observation: 'A raised desk mic sounds hollow',
    firstChecks: 'How low is it over the hard desk? Are papers or a laptop between? Is the capsule raised toward the mouth?',
    options: ['Raise it toward the mouth, off the desk', 'Boost the treble to bring back the clarity', 'Lay a second mic flat on the desk beside it'],
    correct: 'Raise it toward the mouth, off the desk',
    explain: 'Low over a hard desk, the bounce arrives soon and strong. Raised toward the mouth, the copy is later and weaker; a purpose-built boundary mic on the desk is another answer.',
    why: {
      'Boost the treble to bring back the clarity': 'EQ cannot fill the cancelled pitches.',
      'Lay a second mic flat on the desk beside it': 'Two mics on one voice comb in the sum.',
    },
  },
  {
    id: 'b2.sym.inshot',
    observation: 'The boom appears in the top of the wide shot',
    firstChecks: 'Which frame is widest? Did the camera reframe? Is the arm at the height marked for the widest shot?',
    options: ['Recheck the widest frame; raise it outside', 'Ask the camera to stay in the close shot', 'Lower the boom so it hears the anchor better'],
    correct: 'Recheck the widest frame; raise it outside',
    explain: 'Check the widest active frame before each take, including reframes and the second camera. Keep the arm and its shadow out of every one.',
    why: {
      'Ask the camera to stay in the close shot': 'The picture is the program’s decision; the boom works round it.',
      'Lower the boom so it hears the anchor better': 'Lower puts it further into the shot.',
    },
  },
  {
    id: 'b2.sym.feedback',
    observation: 'Public interview: the PA rings when the guest leans back',
    firstChecks: 'Lower the level at once. Is the guest now far from their mic? Too many open mics? Where is the PA against the pattern?',
    options: ['Lower it, then fix the distance and open mics', 'Turn the guest’s mic up so the voice stays over it', 'Swap the gooseneck for an omni nearer the PA'],
    correct: 'Lower it, then fix the distance and open mics',
    explain: 'Pull the level down first, then bring the mic back to the mouth, close unused mics and put the PA in the pattern’s rejection — with the responsible operator. Never provoke feedback.',
    why: {
      'Turn the guest’s mic up so the voice stays over it': 'More gain feeds the loop.',
      'Swap the gooseneck for an omni nearer the PA': 'An omni nearer the PA hears it from every side.',
    },
  },
  hollowVoiceSymptom('b2.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b2.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of setting up an anchor’s mics in the order you would do them.',
    steps: [
      { text: 'Ask for the shot, the moves, the turns and the route', early: 'Start with the program and the picture, before any equipment.' },
      { text: 'Ask the anchor and wardrobe; check the mic and its adapter', early: 'The person and the electrical path come before fitting.' },
      { text: 'Fit a visible, centred lav with a loop; secure the cable', early: 'Fit the mic once you have agreement and the right path.' },
      { text: 'Set gain on normal and emphatic speech, with headroom', early: 'Gain comes once the mic is fitted.' },
      { text: 'Rehearse turns to the camera, the guest and the script', early: 'Check the movement once the level is set.' },
      { text: 'Add a tested fallback — a boom or desk mic — on its own track', early: 'Add the fallback after the main mic works.' },
      { text: 'Trace every route; live, working level only', early: 'Routing and the live check come last.' },
    ],
    explain: 'A sensible order. Hide a lav only after the visible place works; rig an overhead boom with qualified crew; live, never raise a level to find feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b2.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recorded seated interview in a quiet studio: an anchor and a guest, a two-shot, no loudspeakers.',
    setups: [
      { id: 'a', label: 'A centred lav on each, on separate labelled channels', ok: true, power: 'pack', feedback: 'A suggested start — check turns, the clothes and an overlap in the program.' },
      { id: 'b', label: 'A boom just outside the frame for each voice, the lavs as fallbacks', ok: true, power: 'phantom', feedback: 'A suggested start — check the widest frame and keep each fallback on its own track.' },
      { id: 'c', label: 'One boundary on the desk between them for both', ok: false, power: 'phantom', feedback: 'Shared and far from both mouths: less control, more room and papers.' },
      { id: 'd', label: 'The camera’s mic only, its gain turned up', ok: false, power: 'phantom', feedback: 'As far as the camera: the room comes up with the voices.' },
      { id: 'e', label: 'Both lavs hidden before any visible test', ok: false, power: 'pack', feedback: 'Conceal only after the visible place works, and compare.' },
    ],
    reasons: [docReason('the lips'), clearReason('the clothes, the papers and the frame'), { id: 'r.channels', label: 'Each speaker on their own labelled channel, checked alone and in overlap', role: 'required', feedback: 'Say how the two voices are kept apart.' }, { id: 'r.hidden', label: 'A hidden lav sounds the same as a visible one', role: 'wrong', feedback: 'Cloth over a capsule can dull and rub: compare them.' }, BRAND_REASON('news anchor'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, clear of the clothes and the frame, a channel for each speaker — and no claim that hidden sounds the same.',
  },
  {
    id: 'b2.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A public interview: an anchor and a guest at a desk, an audience and a PA, a broadcast program.',
    setups: [
      { id: 'a', label: 'A centred lav each, the fewest open, the PA checked with the operator', ok: true, power: 'pack', feedback: 'A suggested start — check the margin at a safe level.' },
      { id: 'b', label: 'A gooseneck each, raised, its rejection toward the PA', ok: true, power: 'phantom', feedback: 'A suggested start — check the actual pattern against the PA’s place.' },
      { id: 'c', label: 'Every mic on the desk left open in case', ok: false, power: 'phantom', feedback: 'Each open mic hears the PA: less margin before feedback.' },
      { id: 'd', label: 'The boom and the lav both in the program', ok: false, power: 'phantom', feedback: 'Two mics on one voice comb. Choose one.' },
      { id: 'e', label: 'Raise the mics until the PA rings, then back off', ok: false, power: 'phantom', feedback: 'Never provoke feedback. Bring each to its working level only.' },
    ],
    reasons: [docReason('the lips'), clearReason('the talkers, the papers and the frame'), { id: 'r.one', label: 'One mic on air per voice; the fewest mics open', role: 'required', feedback: 'Say how the open mics are kept to the ones needed.' }, { id: 'r.op', label: 'The PA level and the mics checked with the operator', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('news anchor'), { id: 'r.loudest', label: 'Turn the mics up until the voices beat the PA', role: 'wrong', feedback: 'More gain brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: close mics measured from the lips, one on air per voice, the fewest open, the PA toward the rejection and checked with the operator — and no feedback provoked.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the anchor turns to the guest. Which mic keeps its distance to the mouth?', options: ['The lav', 'The fixed boom', 'None of them'], after: 'Now STEP through (or PLAY ONCE), then turn the head, switch the shot, try the desk and open both lavs.' },
  microphone: { prompt: 'Before you choose: which mic hears no clothing at all?', options: ['A visible lav', 'A boom outside the frame', 'A hidden lav'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you hide the lav under one layer of the shirt. What changes?', options: ['It can dull and rub', 'Nothing at all', 'It depends on the shirt'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is at the stage’s front corner. Where will a supercardioid gooseneck reject it best?', options: ['Straight in front', 'Off to the rear, about 125°', 'At its side'], after: 'Now turn or tilt the gooseneck with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the lav’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'The anchor reads down at the script. What happens at the lav on the chest?',
    options: ['The mouth tips away; the lav stays put', 'The lav tips down with the head, on aim', 'Nothing: the lav is fixed to the shirt'],
    correct: 'The mouth tips away; the lav stays put',
    explain: 'The lav moves with the chest. As the head tips, the mouth and its axis move: the distance and the angle change.',
    why: {
      'The lav tips down with the head, on aim': 'Only a headset moves with the head.',
      'Nothing: the lav is fixed to the shirt': 'The lav is fixed — the mouth is not.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'The camera widens to a two-shot. Where does the boom go?',
    options: ['Farther away, out of the wider frame', 'Closer, as the anchor looks smaller', 'Exactly where it was before'],
    correct: 'Farther away, out of the wider frame',
    explain: 'The wider frame’s top is higher: the boom stays just outside it, farther from the mouth.',
    why: {
      'Closer, as the anchor looks smaller': 'The anchor only looks smaller; the frame’s edge moved out.',
      'Exactly where it was before': 'Where it was is now in the picture.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Before clipping a lav to the guest, what comes first?',
    options: ['Their agreement, and wardrobe’s on the clothes', 'The camera’s shot first, and then the lav itself', 'A test of the radio from the control room'],
    correct: 'Their agreement, and wardrobe’s on the clothes',
    explain: 'A mic goes on a person only with their agreement; wardrobe approves any change to the clothes; the wearer can take it off at any time.',
    why: {
      'The camera’s shot first, and then the lav itself': 'The shot matters, but the person comes first.',
      'A test of the radio from the control room': 'The radio check comes after the mic is fitted with agreement.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    critical: true,
    prompt: 'A fixed boom over the guest’s seat. When may the guest sit down?',
    options: ['Once qualified crew have secured it', 'As soon as the boom looks steady to you', 'Once its cable has been taped down'],
    correct: 'Once qualified crew have secured it',
    explain: 'An overhead boom is rigged and secured by qualified crew before anyone sits beneath it.',
    why: {
      'As soon as the boom looks steady to you': 'Looking steady is not the same as secured.',
      'Once its cable has been taped down': 'The cable is one part; the stand, the arm and the clamp need the crew.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'The boom and the anchor’s lav. The program gets…',
    options: ['One; the other on its own track', 'Both, summed at an even level', 'The lav, with the boom tucked under it'],
    correct: 'One; the other on its own track',
    explain: 'Summed, the two arrival times comb. Choose the intended channel and keep the other as the tested fallback.',
    why: {
      'Both, summed at an even level': 'Even levels make the deepest comb.',
      'The lav, with the boom tucked under it': 'Tucked under or not, a second open mic on one voice still combs.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA loudspeaker at the stage’s front corner, on the anchor’s left',
    short: 'PA',
    p: { x: PA_C.x, y: SEATED_FLOOR, z: PA_C.z },
    lift: SEATED_FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole at the stage’s front corner, facing the audience: its back and side spill toward the desk — off to the side of a desk mic aimed up at the anchor.',
    prov: { kind: 'illustrative', reason: 'a typical small stage: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B02_LESSON: Lesson = {
  id: 'B02',
  labId: 'broadcast',
  title: 'News Anchors and Seated Interviews',
  subtitle: 'A centred lav about 12–25 cm from the lips, a boom just outside the frame, a desk mic where the shot allows — a channel for each speaker',
  noun: { one: 'anchor', many: 'anchors', subject: 'anchor', person: true },
  model: B02_MODEL,
  micTypeIds: ['locLav', 'shotgunShort', 'compactHyper', 'bcGoose', 'bcBoundaryDesk'],
  zones: B02_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A seated anchor or interview guest on camera, who looks to a camera, a co-anchor, a monitor or another person, handles papers and changes posture while speaking.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'News sets, studio interviews, talk shows and public interviews: a lav on each talker, a boom just out of the shot, a gooseneck or a boundary mic on the desk.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It keeps each voice clear through turns and posture changes, fits the picture, and gives each speaker their own channel.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT PLACE', text: 'The shot, the movement and the route decide. Begin with a centred, visible lav, rehearse the real turns, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, quiet or emphatic.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; S and T send a narrow hiss forward. A lav on the chest and a boom above are out of that path; a desk mic raised in front of the mouth may meet it.',
    body: 'The vowels carry most of the level and the tone. A lav hears them from below the chin, a boom from above with more room, a desk mic from in front with the desk’s bounce. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'anchor', label: 'the anchor', short: 'ANCHOR', note: 'Seated at the desk, the mouth at the point every distance is read from. The head turns to the camera, the guest and the script.', prov: { kind: 'illustrative', reason: 'the shared figure seated (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'guest', label: 'the guest', short: 'GUEST', note: 'Beside the anchor, 80 cm along the desk: their voice reaches every open mic near them — later and lower. A guest angled 30–45° toward the anchor also works.', prov: { kind: 'illustrative', reason: 'the lesson L32; the spacing a drawing default' }, tag: 'BLEED', scene: 'all' },
      { id: 'desk', label: 'the desk and its papers', short: 'DESK', note: 'A hard top 45 cm below the lips: it reflects the voice into a raised mic, and papers, a keyboard and taps travel through it.', prov: { kind: 'illustrative', reason: 'the lesson L6, L29' }, tag: 'REFLECTION', scene: 'all' },
      { id: 'clothes', label: 'the clothes and the earpiece', short: 'CLOTHES', note: 'A jacket, a tie, hair, jewellery and the earpiece’s cable can brush a lav. Wardrobe approves any change.', prov: { kind: 'illustrative', reason: 'the lesson L8, L10' }, tag: 'NOISE', scene: 'all' },
      { id: 'frame', label: 'the camera’s frame', short: 'FRAME', note: 'A boom stays just outside the widest frame; a reframe or a second camera can bring it into the picture.', prov: { kind: 'illustrative', reason: 'the lesson L6, L15' }, tag: 'PICTURE', scene: 'studio' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'A public interview: it faces the audience, but every open mic on the set hears it.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'PUBLIC: close mics, the fewest open, a pattern’s rejection toward the PA where the mic has one, every route traced. Never provoke feedback.',
    studio: 'NEWS SET: a centred lav on each talker on separate channels, a boom just outside the widest frame as program or fallback, a desk mic where the shot allows.',
  },
  diagnostic,
  practice: {
    task: 'Choose an anchor’s setup for a recorded interview and for a public one, describe an alternative, and explain what would justify a second mic. On a real set, with everyone’s agreement, you can record what you tried below.',
    fields: [
      { id: 'set', label: 'Production, shot and room', kind: 'text' },
      { id: 'mic', label: 'Mic, where it is and its pattern', kind: 'choice', choices: ['visible lav', 'hidden lav', 'boom above the frame', 'gooseneck on the desk', 'boundary on the desk', 'other'] },
      { id: 'distance', label: 'Distance from the lips and the aim', kind: 'text' },
      { id: 'mount', label: 'Mount, garment or stand, and the desk', kind: 'text' },
      { id: 'routes', label: 'Program, recorder, earpiece and PA', kind: 'text' },
      { id: 'notes', label: 'Turns, noise, picture and decision (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The seated anchor and guest: the lips 450 mm above a 740 mm desk (the floor 1190 mm below the lips), the guest 80 cm along the desk on the anchor’s right — drawing defaults.', dims: ['yFloor'] },
    { text: 'The desk (70 cm deep, from 65 cm on the anchor’s left to 65 cm past the guest), the gooseneck’s base, the boundary’s place, the scripts — drawing defaults. The gooseneck’s 20–30 cm is the panels lesson’s drawing default; no source gives one here.', dims: [] },
    { text: 'The camera (2.6 m out at eye level) and its two shots — drawing defaults. The boom’s start is calculated from the drawing: the tube’s tip 15 cm outside the widest frame on a line 45° up and 20° to the anchor’s left, the capsule the tube’s length behind it; the stand’s arm (85 cm) and its column are drawing defaults.', dims: [] },
    { text: 'The lav’s place on the chest is the shared figure’s; its distance (about 21 cm) falls inside the researched 12.5–25 cm band. The PA’s place (2.2 m out, 1.6 m to the left, 1.7 m up) — a drawing default. The head turns about its centre; the desk reflects as a mirror (simplified pictures).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every anchor, set, mic and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: seated talkers in a typical pose, the camera and its shots as drawing defaults, the boom’s place calculated from the frame, the desk’s reflection as a mirror, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m and measured from the lips to the mic’s front (a short shotgun’s capsule). Ask first; skin-safe adhesive only on skin; overhead booms rigged by qualified crew; never provoke feedback.',
  copy: B02_COPY,
};
