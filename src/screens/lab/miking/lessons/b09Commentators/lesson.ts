/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B09-Commentators-and-Announce-Positions-Miking-Technique.txt,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7B-G1") applied — the headset's pattern kept in the
 * internal record (B09-02), no model or maker named, the institutional
 * wording turned to "you" (R-07), hearing and feedback in plain words.
 *
 * One commentator at the desk with the POSITION as its variant (WHERE: BOOTH
 * / OPEN / QUIET BOOTH), on the seated talker (shared/broadcast, frame V on
 * the commentator). OWNER RULING 2026-10-04 — suggested starting points,
 * never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingCheck, hollowSymptom, polarityDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { SEATED_FLOOR } from '../shared/broadcast/talkerPose.ts';
import { B09_MODEL, PA_C } from './geometry.ts';
import { B09_ZONES } from './model.ts';
import { B09_COPY } from './copy.ts';

const W: Words = { noun: 'commentary', player: 'commentator', moving: 'the head, the hands and the notes' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the commentator and the position',
    goal: 'Get to know a commentator at work — where the voice leaves, the desk, the notes and the screen, the window or the open rail, the partner beside them, the crowd and the PA — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; following the play, the partner, the crowd and the PA decide what else a commentary mic hears.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the commentator, what following the play does at a fixed mic, and how much of the partner’s voice reaches your mic — by distance and by pattern.',
    credit: { scenarios: ['b9.snd.1', 'b9.snd.2', 'b9.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A fixed mic loses a commentator who follows the play; a headset boom turns with the head. A close mic keeps the partner much lower than your own voice — no pattern makes them vanish.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each commentary mic goes — the program, the recorder, your own headphones, the producer’s cues — what the cough and talkback keys do, and what to settle before any mic goes up.',
    credit: { scenarios: ['b9.set.1', 'b9.set.2', 'b9.set.3', 'b9.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Survey the position, hear a real call, trace every route — the cough key, talkback, a return without your own voice, the crowd on its own channel — and start the headphone level low.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a commentator’s mic by how they work — a headset boom that follows the head, a lip ribbon that sets its own distance, a desk-arm mic for a quiet booth — not by a brand or a promise of silence.',
    credit: { scenarios: ['b9.mic.1', 'b9.mic.2', 'b9.mic.3', 'b9.mic.4', 'b9.rec.1'], note: 'Answer the five checks (one reaches back to the commentator and the position).' },
    takeaway: 'A headset boom at the mouth corner for a commentator who moves; a lip ribbon with its own guard for a loud open position; a desk-arm mic where the caller sits still. Closeness does most of the work; no pattern makes the crowd vanish.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a headset boom at the outside corner of the mouth in the booth, a lip ribbon’s guard on the lip at an open position — then move the mic and see what changes.',
    credit: { scenarios: ['b9.place.1', 'b9.place.2', 'b9.place.3', 'b9.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the commentator, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — not a rule. The corner of the mouth keeps the capsule out of the breath; clearance from the face, glasses and notes comes first.',
  },
  context: {
    title: 'Booth or open position',
    goal: 'Aim a lip ribbon so its side null faces the PA at an open position — and know why a closed booth and an open rail need different choices.',
    credit: { scenarios: ['b9.ctx.1', 'b9.ctx.2', 'b9.ctx.studio', 'b9.rec.3'], interactive: 'wedgeInNull', note: 'OPEN: aim the lip mic until the PA sits in its side null. BOOTH: answer the decision card. Then the three checks.' },
    takeaway: 'In a closed booth the glass and close headsets do most of it; at an open position the crowd and the PA reach every mic — a close mic, and a pattern’s null aimed where it helps. No pattern cancels a stadium.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two commentators’ open mics can make a voice sound hollow, how the arrival-time difference places comb notches, and why each voice stays on its own channel.',
    credit: { scenarios: ['b9.two.1', 'b9.two.2', 'b9.two.3', 'b9.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each voice reaches the partner’s mic later and much lower: the sum cancels some pitches. Close booms, each on its own labelled channel, checked alone and in mono; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the capsule’s place, the boom, the head’s movement, the partner, the PA, the route — before reaching for a gate, EQ or more gain.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a commentary position in the right order, choose and justify a setup for a two-person booth and an open position, and say what would justify a second mic.',
    credit: { scenarios: ['b9.prac.order', 'b9.prac.gain', 'b9.prac.setup1', 'b9.prac.setup2', 'b9.prac.3', 'b9.mix.1', 'b9.mix.2', 'b9.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The position sheet is optional — it needs a real commentator.' },
    takeaway: 'A close mic at a repeatable place, out of the breath; a channel per voice; every route traced — cough, talkback, the return, the crowd bed; a fallback ready. A brand, a promise of silence or a hotter signal do not pass — and more than one setup can.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: b9.snd.* L5, L12, L28 ·
 * b9.set.* L26, L31, L32, L33 · b9.mic.* L12–L22, L24 · b9.place.* L12,
 * L25, L26 · b9.ctx.* L26, L29 · b9.two.* L28 · b9.prac.* / b9.mix.* L35–L41.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b9.snd.1',
    page: 'sound',
    prompt: 'The commentator turns to follow a play down the field. What happens at a mic fixed on a desk arm?',
    options: ['The mouth moves off its axis: duller, quieter', 'The arm turns the mic to follow the mouth', 'Nothing changes: the desk arm is close enough'],
    correct: 'The mouth moves off its axis: duller, quieter',
    explain: 'The arm holds the mic still while the head turns about its centre: the mouth moves away and off the axis. A headset boom turns with the head and keeps one distance.',
    why: {
      'The arm turns the mic to follow the mouth': 'An arm holds still. Only a headset boom moves with the head.',
      'Nothing changes: the desk arm is close enough': 'Closer makes it worse: the same turn is a bigger share of a short distance.',
    },
  },
  {
    id: 'b9.snd.2',
    page: 'sound',
    prompt: 'Your mic is 3 cm from your lips; your partner’s mouth is 90 cm from it. Before any pattern, how much lower does their voice arrive?',
    options: ['About 30 dB, by distance alone', 'About 3 dB: they are only one seat away', 'Nothing lower: a voice carries the same everywhere'],
    correct: 'About 30 dB, by distance alone',
    explain: 'Thirty times farther is about 30 dB lower (20·log of the ratio). A close mic does most of the work; the pattern adds to it — on paper.',
    why: {
      'About 3 dB: they are only one seat away': 'The ratio of the distances counts, not the seats: 90 cm against 3 cm is thirty times farther.',
      'Nothing lower: a voice carries the same everywhere': 'Level falls with distance from the mouth — that is why a close mic helps.',
    },
  },
  {
    id: 'b9.snd.3',
    page: 'sound',
    prompt: 'Two commentators, both mics open. Why can one voice sound hollow in the mix?',
    options: ['It reaches both mics, the far one later', 'The far mic reverses that voice’s polarity', 'Two open mics make that voice twice as loud'],
    correct: 'It reaches both mics, the far one later',
    explain: 'Each voice reaches its own mic first and the partner’s mic a little later. Summed, some pitches cancel. Close booms and pulling down the mic of whoever is silent keep it small.',
    why: {
      'The far mic reverses that voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'Two open mics make that voice twice as loud': 'The far copy is much lower and later: it colours the sound more than it adds level.',
    },
  },
  hearingCheck('b9.set.1', W),
  {
    id: 'b9.set.2',
    page: 'setting',
    prompt: 'You hold the cough key down. Where does your mic go?',
    options: ['Nowhere while it is held: off the program', 'Still to the program, a little quieter', 'To the crowd mics’ channel instead'],
    correct: 'Nowhere while it is held: off the program',
    explain: 'A cough key cuts the mic while it is held. Check before the event where the mic goes with each key — cough, talkback — and release them before the next call.',
    why: {
      'Still to the program, a little quieter': 'A cough key cuts the mic; it does not turn it down.',
      'To the crowd mics’ channel instead': 'The crowd mics are separate sources; a key does not reroute your voice into them.',
    },
  },
  {
    id: 'b9.set.3',
    page: 'setting',
    prompt: 'A commentator hears their own voice come back late in the headphones. What is the return doing?',
    options: ['Sending the whole program, their voice included', 'Sending only the producer’s cues, with no program at all', 'Sending them the crowd mics on their own'],
    correct: 'Sending the whole program, their voice included',
    explain: 'Their return should be the program minus their own voice (mix-minus), with the producer’s cues; they hear themselves directly. Otherwise their own voice comes back late through the chain.',
    why: {
      'Sending only the producer’s cues, with no program at all': 'Cues alone carry no late copy of their voice.',
      'Sending them the crowd mics on their own': 'The crowd is not their own voice; the late copy comes from the program.',
    },
  },
  {
    id: 'b9.set.4',
    page: 'setting',
    prompt: 'Where should the headphone return start before the event?',
    options: ['Low first, then comfortable under real noise', 'At the top, so cues are heard over the loudest crowd', 'Wherever the last commentator happened to leave it'],
    correct: 'Low first, then comfortable under real noise',
    explain: 'Start low and set a comfortable return under representative crowd noise. Closed earcups reduce some noise, but a headset is not hearing protection unless rated as such.',
    why: {
      'At the top, so cues are heard over the loudest crowd': 'A loud return risks hearing; set it under real noise, from low.',
      'Wherever the last commentator happened to leave it': 'Someone else’s level may be far too loud. Start low each time.',
    },
  },
  {
    id: 'b9.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The commentator turns to the analyst. Which mic keeps the same distance to the mouth?',
    options: ['A headset boom: it turns with the head', 'A desk-arm mic, set close to the mouth', 'The nearest mic, as long as it is cardioid'],
    correct: 'A headset boom: it turns with the head',
    explain: 'The headset rides on the head, so its capsule stays at the mouth corner through every turn. A mic on an arm stays put while the mouth moves.',
    why: {
      'A desk-arm mic, set close to the mouth': 'Close makes a turn a bigger change, not a smaller one.',
      'The nearest mic, as long as it is cardioid': 'The pattern does not move the mic with the head.',
    },
  },
  {
    id: 'b9.mic.1',
    page: 'microphone',
    prompt: 'Where does a commentary headset’s capsule start?',
    options: ['At the outside corner of the mouth', 'Straight in front of the lips, touching', 'Under the chin, pointing up at the jaw'],
    correct: 'At the outside corner of the mouth',
    explain: 'Close, but beside the mouth, just out of the breath — aimed at the mouth. Straight in front puts it in the blast of every P and B.',
    why: {
      'Straight in front of the lips, touching': 'In front, in the breath: pops and blasts. Beside the mouth is the start.',
      'Under the chin, pointing up at the jaw': 'The voice leaves the mouth, not the jaw: the capsule goes by the mouth corner.',
    },
  },
  {
    id: 'b9.mic.2',
    page: 'microphone',
    prompt: 'What does a lip ribbon’s guard do?',
    options: ['Sets the same mouth distance every time', 'Blocks the crowd from the back of the mic', 'Lets you blow into it to test the ribbon'],
    correct: 'Sets the same mouth distance every time',
    explain: 'The guard rests on the upper lip, so the distance repeats call after call. Use the guard the mic was made with; never blow into a mic to test it.',
    why: {
      'Blocks the crowd from the back of the mic': 'A figure-8 still hears its back: the guard sets distance, it does not block sound.',
      'Lets you blow into it to test the ribbon': 'Never blow into a mic — a ribbon can be damaged by a blast of air.',
    },
  },
  {
    id: 'b9.mic.3',
    page: 'microphone',
    prompt: 'What does a close-talking commentary mic do about the crowd?',
    options: ['It keeps the voice well ahead of the crowd', 'Its pattern removes the crowd from the mic', 'Its closed earcups keep the crowd out of it'],
    correct: 'It keeps the voice well ahead of the crowd',
    explain: 'Closeness and pattern keep the voice ahead of the crowd. Nothing makes a stadium vanish; the crowd’s own mics carry its energy on purpose.',
    why: {
      'Its pattern removes the crowd from the mic': 'A pattern reduces some directions; it never removes a crowd that surrounds the position.',
      'Its closed earcups keep the crowd out of it': 'Earcups change what the commentator hears, not what the mic hears.',
    },
  },
  {
    id: 'b9.mic.4',
    page: 'microphone',
    prompt: 'When does a desk-arm mic suit a commentary position?',
    options: ['A quiet booth, a caller who sits still', 'A loud open rail, a caller who moves', 'Wherever it fits, if the arm is long enough'],
    correct: 'A quiet booth, a caller who sits still',
    explain: 'On an arm the mic stays put: fine in a quiet, enclosed booth with a steady caller; a commentator who follows the play leaves its axis.',
    why: {
      'A loud open rail, a caller who moves': 'Moving away from a fixed mic in a loud place brings the crowd up against the voice.',
      'Wherever it fits, if the arm is long enough': 'Arm length does not make the mic follow the head.',
    },
  },
  {
    id: 'b9.place.1',
    page: 'placement',
    prompt: 'A headset start says “at the corner of the mouth, out of the breath”. What is it measured from?',
    options: ['The lips, to the front of the capsule', 'The ear pivot, to the far end of the boom', 'The chin, to the headset band'],
    correct: 'The lips, to the front of the capsule',
    explain: 'The voice leaves at the mouth, so every distance starts at the lips and ends at the mic’s front — here the capsule’s foam.',
    why: {
      'The ear pivot, to the far end of the boom': 'The boom starts at the ear; the distance that matters is from the lips.',
      'The chin, to the headset band': 'The chin is not where the voice leaves. Measure from the lips.',
    },
  },
  {
    id: 'b9.place.2',
    page: 'placement',
    prompt: 'Pops on every P and B from a headset boom. A first idea to try?',
    options: ['Move the capsule a little out of the breath', 'Cut all the low end on the channel', 'Swing the boom away so it faces the cheek instead'],
    correct: 'Move the capsule a little out of the breath',
    explain: 'Beside the mouth corner, still aimed at the mouth, the air of P and B passes by; its foam helps. A filter cannot undo a blast that overloaded the input.',
    why: {
      'Cut all the low end on the channel': 'A deep cut thins the voice and leaves the blast at the capsule.',
      'Swing the boom away so it faces the cheek instead': 'Aimed away, the capsule hears less voice and more crowd.',
    },
  },
  {
    id: 'b9.place.3',
    page: 'placement',
    prompt: 'You move a headset capsule from the mouth corner to 6 cm out to the side. What tends to change?',
    options: ['Less voice against the crowd, fewer pops', 'More voice and more low end in the mic', 'Only the level changes, not the tone at all'],
    correct: 'Less voice against the crowd, fewer pops',
    explain: 'Farther from the mouth the voice drops against the crowd; out of the breath, fewer pops. Compare at matched loudness.',
    why: {
      'More voice and more low end in the mic': 'That is moving closer. Farther brings less voice and less proximity bass.',
      'Only the level changes, not the tone at all': 'A directional mic’s tone changes with distance and angle too.',
    },
  },
  {
    id: 'b9.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does almost all of the commentator’s voice leave?',
    options: ['The mouth — every distance starts at the lips', 'The throat, low in the neck where the folds are', 'The chest, behind the breastbone, where it resonates'],
    correct: 'The mouth — every distance starts at the lips',
    explain: 'The voice is made in the throat but leaves through the mouth (on m, n and ng partly the nose). Distances are read from the lips.',
    why: {
      'The throat, low in the neck where the folds are': 'The folds start the sound; it leaves through the mouth.',
      'The chest, behind the breastbone, where it resonates': 'The chest is not where the voice leaves a talker.',
    },
  },
  {
    id: 'b9.ctx.1',
    page: 'context',
    prompt: 'An open position, the PA high to the front-left. A fair first step for the commentary mic?',
    options: ['Close, its least sensitive side toward the PA', 'Farther back, so it hears a more natural stadium', 'Turned up until the voice is over the PA'],
    correct: 'Close, its least sensitive side toward the PA',
    explain: 'A close mic keeps the voice ahead of the PA and the crowd; then aim its quietest direction at the PA. Test with the venue live; never provoke feedback.',
    why: {
      'Farther back, so it hears a more natural stadium': 'Farther from the mouth, the PA and the crowd rise against the voice.',
      'Turned up until the voice is over the PA': 'More gain raises the PA with the voice.',
    },
  },
  {
    id: 'b9.ctx.2',
    page: 'context',
    prompt: 'A figure-8 lip mic is held to the mouth. Where is it least sensitive?',
    options: ['At its sides, 90° off its front', 'Behind it, where it faces the crowd', 'Straight in front, at the mouth'],
    correct: 'At its sides, 90° off its front',
    explain: 'A figure-8 hears its front and its back equally and least at its sides. Its back faces out over the crowd: the crowd is not rejected there.',
    why: {
      'Behind it, where it faces the crowd': 'A figure-8’s back is as sensitive as its front.',
      'Straight in front, at the mouth': 'The front is where it hears most — that is why it faces the mouth.',
    },
  },
  {
    id: 'b9.ctx.studio',
    page: 'context',
    prompt: 'Two commentators in a closed booth, headsets on. What is a fair first setup?',
    options: ['A headset boom each, on its own channel', 'One mic on the desk between the two of them', 'A loudspeaker in the booth so both can hear'],
    correct: 'A headset boom each, on its own channel',
    explain: 'A boom each at the mouth corner, each on its own labelled channel, hearing the program on headphones: a place to begin.',
    why: {
      'One mic on the desk between the two of them': 'Far from both mouths: more crowd and no way to balance the two voices.',
      'A loudspeaker in the booth so both can hear': 'A loudspeaker near open mics sends the program back into them.',
    },
  },
  {
    id: 'b9.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Your partner turns to talk to you. What happens to their voice in your mic?',
    options: ['It rises: their mouth now faces your mic', 'It drops: they are facing away from the field', 'Nothing: your mic is cardioid'],
    correct: 'It rises: their mouth now faces your mic',
    explain: 'A voice is louder and brighter in front of the mouth than to its side: turned toward you, more of their voice reaches your mic — and their mouth is a little closer too. Check each channel while the other talks.',
    why: {
      'It drops: they are facing away from the field': 'Facing away from the field is facing toward you — and your mic.',
      'Nothing: your mic is cardioid': 'A cardioid still hears the sides, and the turn changes what the voice sends your way.',
    },
  },
  {
    id: 'b9.two.1',
    page: 'twoMic',
    prompt: 'The commentator’s voice sounds hollow with both mics open. Why?',
    options: ['It reaches the analyst’s mic later', 'The analyst’s mic reverses its polarity', 'The closer mic is louder, so it cancels'],
    correct: 'It reaches the analyst’s mic later',
    explain: 'The voice reaches its own mic first and the analyst’s later. Summed, some pitches arrive out of step and cancel — a comb.',
    why: {
      'The analyst’s mic reverses its polarity': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b9.two.2'),
  {
    id: 'b9.two.3',
    page: 'twoMic',
    prompt: 'The analyst is silent through a long passage of play. A fair step for their mic?',
    options: ['Pull it down until they speak, minding first words', 'Turn it up so it catches more of the crowd’s energy', 'Swap it for an omni so it hears both voices'],
    correct: 'Pull it down until they speak, minding first words',
    explain: 'A mic no one is using only adds the other voice later and more crowd. Pull it down — and make sure the analyst’s first words are not lost when they come in.',
    why: {
      'Turn it up so it catches more of the crowd’s energy': 'The crowd has its own mics; more gain here adds bleed and crowd, not voice.',
      'Swap it for an omni so it hears both voices': 'An omni hears the other commentator even more: more bleed, more comb.',
    },
  },
  {
    id: 'b9.two.4',
    page: 'twoMic',
    prompt: 'Why keep each commentator on their own labelled channel?',
    options: ['Each can be checked and balanced alone', 'Two channels make both of the voices louder', 'So the two mics form a stereo pair'],
    correct: 'Each can be checked and balanced alone',
    explain: 'On separate channels each voice can be soloed, levelled, pulled down when silent and checked in mono with the other. A sum made at the source cannot be undone.',
    why: {
      'Two channels make both of the voices louder': 'Level comes from gain, not from channels.',
      'So the two mics form a stereo pair': 'They are two close voice mics, not a stereo pair.',
    },
  },
  {
    id: 'b9.prac.gain',
    page: 'practice',
    prompt: 'The goal call lights the overload light; normal calling sits well below it. What do you do?',
    options: ['Lower the input gain; check the goal call again', 'Pull the channel fader down until the call is clean', 'Ask the commentator to call goals more quietly'],
    correct: 'Lower the input gain; check the goal call again',
    explain: 'Set gain on the most excited real call, with headroom at every stage. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the call is clean': 'The overload is at the input, before the fader: a lower fader only makes the clipped call quieter.',
      'Ask the commentator to call goals more quietly': 'The call is the commentator’s; set gain for what they really do.',
    },
  },
  {
    id: 'b9.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic for one commentator?',
    options: ['A tested fallback, on its own channel, kept closed', 'More mics make the voice sound fuller, so add one more', 'The voice needs more level than one mic gives'],
    correct: 'A tested fallback, on its own channel, kept closed',
    explain: 'A spare headset or a quiet-position mic ready before the event earns its place — on its own channel, opened only when the first fails. Two open mics on one voice comb.',
    why: {
      'More mics make the voice sound fuller, so add one more': 'Two open mics on one voice usually sound hollower, not fuller.',
      'The voice needs more level than one mic gives': 'Level comes from gain and distance, not from another mic.',
    },
  },
  {
    id: 'b9.mix.1',
    page: 'practice',
    prompt: 'Your partner is loud in your channel. A first idea to try?',
    options: ['Check your boom is close and which side it is on', 'Gate your channel hard so it shuts between words', 'Turn your mic up so you stay over your partner'],
    correct: 'Check your boom is close and which side it is on',
    explain: 'Closeness and the boom’s side do most of it: the partner behind the capsule, your mouth close in front. Adjust seating and aim before an aggressive gate.',
    why: {
      'Gate your channel hard so it shuts between words': 'A hard gate chops your own words; fix the placement first.',
      'Turn your mic up so you stay over your partner': 'More gain raises your partner in your channel by the same amount.',
    },
  },
  {
    id: 'b9.mix.2',
    page: 'practice',
    prompt: 'The officials’ or the crew’s private talk is near your commentary feed. What must the program carry?',
    options: ['Only the routes meant for it, checked before air', 'Whatever the commentary mics happen to pick up', 'All the talk, so viewers can hear the inside story'],
    correct: 'Only the routes meant for it, checked before air',
    explain: 'Confirm that the program feed excludes private communication. A mic is cut with its cough key; private circuits stay on their own routes.',
    why: {
      'Whatever the commentary mics happen to pick up': 'Check the routes on purpose; a private word off the air must stay off it.',
      'All the talk, so viewers can hear the inside story': 'Private communication is not program material unless it is approved for air.',
    },
  },
  removeDelayVoice('b9.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b9.sym.pops',
    observation: 'Pops and air blasts on the excited calls',
    firstChecks: 'Is the capsule straight in front of the mouth, in the breath? Is its foam on? Has the boom drifted?',
    options: ['Capsule to the mouth corner; check the foam', 'Cut all the low end on the commentary channel', 'Turn the commentator’s headphones down a long way'],
    correct: 'Capsule to the mouth corner; check the foam',
    explain: 'Beside the mouth, just out of the breath, the air passes by. A filter cannot repair an input overloaded by a blast; recheck after the headset has been worn for a while.',
    why: {
      'Cut all the low end on the commentary channel': 'A deep cut thins the voice and leaves the blast at the capsule.',
      'Turn the commentator’s headphones down a long way': 'The headphone level does not move the breath stream.',
    },
  },
  {
    id: 'b9.sym.turn',
    observation: 'The voice dulls each time the commentator follows the play',
    firstChecks: 'Is the mic on a fixed arm? Does the head leave its axis when they turn?',
    options: ['A headset boom that turns with the head', 'A brighter EQ on the commentary channel', 'Ask the commentator to stop turning'],
    correct: 'A headset boom that turns with the head',
    explain: 'A fixed mic loses the mouth as it turns. A headset boom rides with the head and keeps its distance and angle.',
    why: {
      'A brighter EQ on the commentary channel': 'EQ cannot bring back a mouth that has left the mic.',
      'Ask the commentator to stop turning': 'Following the play is the job; fit the mic to it.',
    },
  },
  {
    id: 'b9.sym.partner',
    observation: 'The analyst is loud in the commentator’s channel',
    firstChecks: 'Are both booms close? Which side does each boom sit? Is the silent mic pulled down?',
    options: ['Close booms, the right side, the silent mic down', 'A hard gate on both channels, set as tight as it goes', 'Turn up the commentator’s mic over the analyst'],
    correct: 'Close booms, the right side, the silent mic down',
    explain: 'Closeness and the boom’s side keep the partner low; a silent mic pulled down keeps the sum clean. Adjust before reaching for a gate.',
    why: {
      'A hard gate on both channels, set as tight as it goes': 'A tight gate chops words and pumps the crowd. Fix the placement first.',
      'Turn up the commentator’s mic over the analyst': 'More gain raises the analyst in that channel too.',
    },
  },
  {
    id: 'b9.sym.pa',
    observation: 'At the open position the PA is louder in the mic than the crowd',
    firstChecks: 'How close is the mic? Where is the PA against its pattern? Is a sheltered position possible?',
    options: ['Closer mic; its quietest side toward the PA', 'Raise the gain so the voice beats the PA', 'Swap to an omni so the PA sounds more natural'],
    correct: 'Closer mic; its quietest side toward the PA',
    explain: 'A close mic keeps the voice ahead; the pattern’s quietest direction aimed at the PA helps. A windscreen and shelter help wind, not reverberant PA. Never provoke feedback.',
    why: {
      'Raise the gain so the voice beats the PA': 'Gain raises the PA with the voice.',
      'Swap to an omni so the PA sounds more natural': 'An omni hears the PA from every side: more of it, not less.',
    },
  },
  {
    id: 'b9.sym.rub',
    observation: 'Rubbing and thumps from the headset',
    firstChecks: 'Is the boom touching glasses, a scarf or a collar? Is the cable pulling? Are the notes knocking it?',
    options: ['Clear the boom and cable; add strain relief', 'Cut the low end and hope it goes', 'Ask the commentator to keep their head still'],
    correct: 'Clear the boom and cable; add strain relief',
    explain: 'Contact noise travels into the boom. Clear it of glasses and clothing, secure the cable with slack and strain relief, keep the notes away.',
    why: {
      'Cut the low end and hope it goes': 'A filter does not stop the contact; it only thins the voice.',
      'Ask the commentator to keep their head still': 'Moving is the job; fit the headset so it allows it.',
    },
  },
  hollowSymptom('b9.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b9.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a commentary setup in the order you would do them.',
    steps: [
      { text: 'Map the position: seats, sight lines, the crowd, the PA, the feeds', early: 'Start with the position, before any equipment.' },
      { text: 'Hear a quiet call and an excited one while following play', early: 'Hear the real call before you choose a mic.' },
      { text: 'Fit each headset and set the boom at the mouth corner', early: 'Fit the mics once you know how the commentators work.' },
      { text: 'Set gain on the most excited call, with headroom', early: 'Gain comes once the mic is placed.' },
      { text: 'Each channel alone while the other talks; then an overlap', early: 'Check the partner once both mics are set.' },
      { text: 'Trace cough, talkback, the return and the crowd bed', early: 'Routing checks come after the mics work.' },
      { text: 'Check the fallback mic and start the return level low', early: 'The fallback and the return level close the setup.' },
    ],
    explain: 'A sensible order. A passive ribbon: check its interface and phantom setting with the audio lead first. Never provoke feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b9.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Two commentators in a closed booth with a window to the field, both following the play and turning to each other.',
    setups: [
      { id: 'a', label: 'A headset boom each at the mouth corner, each on its own channel', ok: true, power: 'none', feedback: 'A recommended start: close, turning with each head — check each channel while the other talks.' },
      { id: 'b', label: 'Supercardioid headsets, booms on the side toward the partner', ok: true, power: 'none', feedback: 'A recommended start — check the actual pattern and where the partner sits against it.' },
      { id: 'c', label: 'One mic on the desk between the two commentators', ok: false, power: 'phantom', feedback: 'Far from both mouths: more crowd, no balance, and every turn changes it.' },
      { id: 'd', label: 'Desk-arm mics for both, set 30 cm out of the way', ok: false, power: 'none', feedback: 'Far and fixed: a turning commentator leaves it, and the partner comes up.' },
      { id: 'e', label: 'The booth loudspeaker on so both can hear the program', ok: false, power: 'none', feedback: 'A loudspeaker near open mics sends the program back in. Use the headsets.' },
    ],
    reasons: [docReason('the lips'), clearReason('the face, glasses and the notes'), { id: 'r.channel', label: 'Each voice on its own labelled channel, checked alone and in mono', role: 'required', feedback: 'Say how the two voices are kept apart.' }, { id: 'r.silent', label: 'The pattern guarantees the partner is not in the mic', role: 'wrong', feedback: 'No pattern guarantees isolation when two people sit close together.' }, BRAND_REASON('commentator'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: a close start measured from the lips, clear of the face and the notes, each voice on its own channel, checked in mono — and no promise of zero bleed.',
  },
  {
    id: 'b9.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An open position: one commentator at the rail, a loud crowd in front, the PA cluster high to the front-left, a breeze.',
    setups: [
      { id: 'a', label: 'A lip ribbon held to the mouth on its guard, its side toward the PA', ok: true, power: 'none', feedback: 'A recommended start: a repeatable close distance — check its rear and the PA with the venue live.' },
      { id: 'b', label: 'A headset boom at the mouth corner with a windscreen', ok: true, power: 'none', feedback: 'A recommended start: close and turning with the head — check wind and the PA.' },
      { id: 'c', label: 'A desk-arm condenser 20 cm away for a natural sound', ok: false, power: 'phantom', feedback: 'Farther and fixed: the crowd and the PA rise against the voice.' },
      { id: 'd', label: 'A shotgun aimed at the commentator from the next seat', ok: false, power: 'phantom', feedback: 'A shotgun at a distance does not isolate a voice in a stadium. Close comes first.' },
      { id: 'e', label: 'Turn the commentary up until it is louder than the PA', ok: false, power: 'none', feedback: 'More gain raises the PA too — and risks feedback.' },
    ],
    reasons: [docReason('the lips'), clearReason('the face, the hands and the rail'), { id: 'r.paths', label: 'The program, the recorder, the return and the crowd bed are traced as separate routes', role: 'required', feedback: 'Say how each destination is checked.' }, { id: 'r.null', label: 'The pattern’s quietest side faces the PA', role: 'optional', feedback: 'A fair open-position reason.' }, BRAND_REASON('commentary position'), { id: 'r.cancel', label: 'The lip mic cancels the whole crowd', role: 'wrong', feedback: 'No mic cancels a stadium; its rear still hears the crowd.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close, repeatable mic measured from the lips, the PA toward its quietest side, every route traced — and no claim of total cancellation.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a commentator’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then turn the head and read your partner in your mic.' },
  microphone: { prompt: 'Before you move anything: which mic keeps one distance as the head turns?', options: ['A headset boom', 'A desk-arm mic', 'Both of them'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you move the headset capsule from the mouth corner to straight in front of the lips. What changes?', options: ['More pops and breath', 'More crowd', 'It depends on this commentator'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'A figure-8 lip mic faces the mouth. Where is it least sensitive to the PA?', options: ['Straight behind it', 'At its sides', 'In front of it'], after: 'Now turn or tilt the mic with AIM and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the analyst’s mic polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A commentator follows the play with a mic fixed on an arm. What changes at the mic?',
    options: ['The mouth leaves its axis: the voice dulls', 'The arm swings with the head, so nothing changes', 'The crowd drops as the head turns away'],
    correct: 'The mouth leaves its axis: the voice dulls',
    explain: 'An arm holds still while the head turns: the mouth moves off the axis and away. A headset boom turns with it.',
    why: {
      'The arm swings with the head, so nothing changes': 'An arm holds still; only a headset follows the head.',
      'The crowd drops as the head turns away': 'The crowd stays; the voice drops against it.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'Your mic is 3 cm from your lips, your partner 90 cm away. Before any pattern, their voice arrives…',
    options: ['About 30 dB lower, by distance', 'About as loud as your own voice', 'About 3 dB lower, one seat away'],
    correct: 'About 30 dB lower, by distance',
    explain: 'Thirty times the distance is about 30 dB lower. A close mic does most of the work.',
    why: {
      'About as loud as your own voice': 'The partner is thirty times farther from the mic.',
      'About 3 dB lower, one seat away': 'The ratio of distances counts, not the number of seats.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Before the event, where do you set a commentator’s headphone return?',
    options: ['Low first, then comfortable under real noise', 'High, so each cue is heard over the loudest crowd', 'At the last commentator’s setting'],
    correct: 'Low first, then comfortable under real noise',
    explain: 'Start low and set a comfortable level under representative crowd noise. A headset is not hearing protection unless rated as such.',
    why: {
      'High, so each cue is heard over the loudest crowd': 'A loud return risks hearing. Start low.',
      'At the last commentator’s setting': 'Someone else’s level may be far too loud for this person.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'What should a commentator hear in their return from production?',
    options: ['The program minus their voice, with cues', 'The whole program, with their own voice included', 'Only the crowd, with no cues at all'],
    correct: 'The program minus their voice, with cues',
    explain: 'Mix-minus with the producer’s cues (IFB); they hear their own voice directly, never late through the chain.',
    why: {
      'The whole program, with their own voice included': 'Their own voice would come back late — distracting.',
      'Only the crowd, with no cues at all': 'They need the program and the producer’s cues.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'You hold the talkback key. Where does your mic go?',
    options: ['To the producer only, off the program', 'To the program and to the producer', 'To the crowd mics’ channel, mixed with them'],
    correct: 'To the producer only, off the program',
    explain: 'Talkback takes the mic off air to the producer while held. Check each key’s route before the event.',
    why: {
      'To the program and to the producer': 'Talkback is kept off the program.',
      'To the crowd mics’ channel, mixed with them': 'A key does not route your voice into the crowd’s mics.',
    },
  },
  {
    id: 'q.6',
    covers: 'sound',
    prompt: 'Where does a commentary headset’s capsule start?',
    options: ['Beside the mouth corner, out of the breath', 'Straight in front of the lips, in the breath', 'Under the chin, aimed at the throat'],
    correct: 'Beside the mouth corner, out of the breath',
    explain: 'Close, at the outside corner of the mouth — not in front of it — aimed at the mouth.',
    why: {
      'Straight in front of the lips, in the breath': 'In the breath: pops and blasts.',
      'Under the chin, aimed at the throat': 'The voice leaves the mouth, not the throat.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA cluster high to the front-left',
    short: 'PA',
    p: { x: PA_C.x, y: SEATED_FLOOR, z: PA_C.z },
    lift: SEATED_FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'High to the front-left of the open position, facing the crowd: its back and side spill toward the commentator — off the back of a mic held to the mouth, and off to one side.',
    prov: { kind: 'illustrative', reason: 'a typical open announce position: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B09_LESSON: Lesson = {
  id: 'B09',
  labId: 'broadcast',
  title: 'Commentators and Announce Positions',
  subtitle: 'A headset boom at the outside corner of the mouth, a lip ribbon on its guard — a channel for each voice, every route traced',
  noun: { one: 'commentator', many: 'commentators', subject: 'commentator', person: true },
  model: B09_MODEL,
  micTypeIds: ['bcHeadsetBoom', 'bcHeadsetSuper', 'bcLipRibbon', 'bcDynArm'],
  zones: B09_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A commentator calling live sport — in a booth, at an open position in the stadium, or from a screen in a quiet booth — often with a partner beside them. The voice must stay clear through the crowd’s peaks while they follow the play, read notes and turn to the partner.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Commentary booths and open announce positions: closed-ear headsets with a boom mic, a lip mic held to the mouth, a screen and notes on the desk, the crowd and the PA outside.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It keeps each commentator intelligible and steady through quiet passages and the loudest peaks, apart from the partner, the crowd and the PA — the crowd’s energy comes from its own mics.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT DISTANCE', text: 'Different mics, positions and voices call for different places. Begin within the mic’s own guidance, let the commentator work naturally, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, the quiet ones and the goal call.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips, and an excited call pushes harder. A capsule straight in front of the mouth sits in that path; beside the mouth corner, still aimed at it, the air passes by.',
    body: 'The vowels carry most of the level and the tone. Close to a directional mic they gain low end (the proximity effect); farther, more of the crowd, the PA and the partner join in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'caller', label: 'the commentator', short: 'COMMENTATOR', note: 'Seated at the desk, the mouth at the point every distance is read from. The head follows the play, reads down and turns to the partner.', prov: { kind: 'illustrative', reason: 'the shared figure seated (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'analyst', label: 'the analyst beside them', short: 'ANALYST', note: 'About 0.9 m to the right: their voice reaches the commentator’s mic later and much lower. A mic each, on its own channel.', prov: { kind: 'illustrative', reason: 'the lesson L28; the spacing a drawing default' }, tag: 'BLEED', scene: 'studio' },
      { id: 'crowd', label: 'the crowd', short: 'CROWD', note: 'In front and below: every commentary mic hears it. A close mic keeps the voice ahead; the crowd’s own mics carry its energy.', prov: { kind: 'illustrative', reason: 'the lesson L5, L29' }, tag: 'NOISE', scene: 'all' },
      { id: 'pa', label: 'the PA cluster', short: 'PA', note: 'At an open position the PA may be louder in the mic than the crowd. Aim the pattern’s quietest side at it; never provoke feedback.', prov: { kind: 'illustrative', reason: 'the lesson L29; its place a drawing default' }, tag: 'SPILL', scene: 'stage' },
      { id: 'notes', label: 'the notes and the screen', short: 'NOTES', note: 'Page turns and reading down: a fixed mic loses the mouth; a boom needs to clear the notes.', prov: { kind: 'illustrative', reason: 'the lesson L5, L6' }, tag: 'MOVEMENT', scene: 'all' },
      { id: 'phones', label: 'the headphones', short: 'HEADPHONES', note: 'Closed earcups: the program, the cues and the commentator’s own voice. Start the level low; they are not hearing protection unless rated.', prov: { kind: 'illustrative', reason: 'the lesson L12, L32' }, tag: 'HEARING', scene: 'all' },
    ],
    stage: 'OPEN POSITION: a close mic — a lip ribbon on its guard or a headset boom — its quietest side toward the PA, the crowd on its own mics, every route traced. Never provoke feedback.',
    studio: 'BOOTH: a headset boom each at the outside corner of the mouth, each on its own channel, the program on headphones, the return without their own voices.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a two-person booth and for an open position, describe an alternative, and explain what would justify a second mic. With a real commentator, the position’s approval and their agreement, you can record what you tried below.',
    fields: [
      { id: 'approval', label: 'Position approved by (the event, the venue) and who may change it', kind: 'text' },
      { id: 'position', label: 'Position, seats, sight lines, the crowd and the PA', kind: 'text' },
      { id: 'mic', label: 'Mic and pattern for each commentator', kind: 'choice', choices: ['headset boom, cardioid', 'headset boom, supercardioid', 'lip ribbon, figure-8', 'desk-arm dynamic', 'other'] },
      { id: 'place', label: 'Capsule or guard position, windscreen, cable route', kind: 'text' },
      { id: 'routes', label: 'Channel map, cough and talkback, the return, the crowd bed', kind: 'text' },
      { id: 'notes', label: 'Partner spill, pops, tone with turns, the fallback (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The seated commentator: the lips 450 mm above a 740 mm desk (the floor 1190 mm below the lips) — drawing defaults; the head is the voice family’s.', dims: ['yFloor'] },
    { text: 'The headset boom: its capsule 2–6 cm beside the mouth corner is the lab’s drawing of “the outside corner of the mouth” (no distance is given); the boom’s length from the ear (170 mm) is a drawing default — the maker gives only its 155° pivot and an 89 mm adjust range.', dims: [] },
    { text: 'The lip ribbon: the guard’s place on the upper lip is the lab’s drawing; how far the ribbon sits behind the guard is not given anywhere readable — a drawing default (60 mm), never shown as a number. The hand holding it is the shared figure’s arm.', dims: [] },
    { text: 'The booth: the desk (1.8 × 0.75 m), the seats 0.9 m apart, the window, the screen and the notes; the open position’s rail, the crowd and the PA cluster’s place (1.8 m out, 3 m to the left, 1.6 m above the lips) — drawing defaults.', dims: [] },
    { text: 'The partner’s voice in your mic is read by distance and an ideal pattern from point mouths, with no room (a simplified picture); the head turns about its centre.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every commentator, mic, position and stadium is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a commentator in a typical seated pose, mic patterns and the two-mic comb as textbook shapes, the partner’s voice by distance and pattern only. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. No mic cancels a stadium; never provoke feedback; start the headphone level low.',
  copy: B09_COPY,
};
