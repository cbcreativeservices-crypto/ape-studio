/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B01-Radio-Podcast-and-Studio-Hosts-Miking-Technique.txt, cited
 * "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7G1") applied — among them the live check without
 * provoking feedback (B01-1, L38: "bring each mic up only to its working
 * level; at any ring, pull it down at once and fix the geometry") and the
 * institutional wording (B-INST: L2, L39, L40).
 *
 * One host at a desk with the SET-UP as its variant (WHERE: STUDIO / LIVE
 * SHOW), on the seated talker (shared/broadcast, frame V on the host).
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * 3:1 is a NOTE, never graded (owner list item 3).
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { SEATED_FLOOR } from '../shared/broadcast/talkerPose.ts';
import { B01_MODEL, PA_C } from './geometry.ts';
import { B01_ZONES } from './model.ts';
import { B01_COPY } from './copy.ts';

const W: Words = { noun: 'host', player: 'host', moving: 'the head, the hands and the papers' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the host and the desk',
    goal: 'Get to know a host at a desk — where the voice leaves, the desk under the mouth, the arm that holds the mic, the laptop and the script, and a second host across the desk — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; the desk, the turns of the head and the second host decide what else a desk mic hears.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the host, what a head turn and reading down do at a fixed mic, how the desk sends a later copy of the voice, and what a second open mic hears.',
    credit: { scenarios: ['b1.snd.1', 'b1.snd.2', 'b1.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A fixed mic hears the voice change as the head turns — the closer the mic, the more; a hard desk adds a later copy; a second open mic adds the other voice, later. Tendencies, and hosts vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know where each mic goes — the headphones, the stream, the recorder, a remote guest’s return, the PA — and what to settle before any mic goes up: the room, the address side, a safe arm, a live check without feedback.',
    credit: { scenarios: ['b1.set.1', 'b1.set.2', 'b1.set.3', 'b1.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Listen to the host and the room, find the address side, secure the arm, give a remote guest the program without their own voice, and bring live mics up to their working level only — never to find feedback.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a host’s mic by its properties — address side, pattern, power, mount — and by the room, not by a brand or by “dynamic means no room”.',
    credit: { scenarios: ['b1.mic.1', 'b1.mic.2', 'b1.mic.3', 'b1.mic.4', 'b1.rec.1'], note: 'Answer the five checks (one reaches back to the host and the desk).' },
    takeaway: 'An end-address dynamic on an arm for close broadcast speech; a side-address condenser in a quiet, treated room; an arm for a steady, repeatable place. Distance and pattern decide the voice against the room — not the transducer alone.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a broadcast dynamic about 10–15 cm from the lips in the studio, closer on a live show — then move the mic and see what changes.',
    credit: { scenarios: ['b1.place.1', 'b1.place.2', 'b1.place.3', 'b1.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the host, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — not a rule. Distance, height and the angle off the mouth’s axis are separate tone controls; clearance from the face, the sight line and the papers comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a live host’s mic so its pattern’s rejection faces the PA — and know why a studio podcast and a live talk show need different choices.',
    credit: { scenarios: ['b1.ctx.1', 'b1.ctx.2', 'b1.ctx.studio', 'b1.rec.3'], interactive: 'wedgeInNull', note: 'LIVE SHOW: aim the mic (or change its pattern) until the PA sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'In the studio, headphones and the loudspeakers off; live, every open mic hears the PA — a close mic, the fewest open mics and the rejection toward the loudspeaker. Studio bleed and PA feedback are related routing problems, not the same thing.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two hosts’ open mics can make a voice sound hollow, how the arrival-time difference places comb notches, and why each host stays on their own channel.',
    credit: { scenarios: ['b1.two.1', 'b1.two.2', 'b1.two.3', 'b1.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each voice reaches the other host’s mic later and lower: the sum cancels some pitches. Close mics, rears toward each other, unused mics muted, each on its own channel; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance, the angle to the mouth, the desk, the arm, the open mics, the route — before reaching for EQ, a gate or noise reduction.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a host’s mic in the right order, choose and justify a setup for a two-host podcast and a live talk show, and say what would justify a second mic.',
    credit: { scenarios: ['b1.prac.order', 'b1.prac.gain', 'b1.prac.setup1', 'b1.prac.setup2', 'b1.prac.3', 'b1.mix.1', 'b1.mix.2', 'b1.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement sheet is optional — it needs a real host.' },
    takeaway: 'The address side, a repeatable distance from the lips, plosive control, proximity effect where it applies, a channel per host, and an honest line between bleed and feedback pass. A brand or a “hotter” signal do not — and more than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the host');

/*
 * THE CHECKS. Lesson lines in comments only: b1.snd.* L5, L21, L24, L27 ·
 * b1.set.* L6, L28, L30, L38 (B01-1) · b1.mic.* L6, L23, L27 (dynamic ≠ room
 * rejection, L5) · b1.place.* L12, L15, L21, L23 · b1.ctx.* L28 · b1.two.*
 * L26–L27 · b1.prac.* / b1.mix.* L30–L39.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b1.snd.1',
    page: 'sound',
    prompt: 'The host reads down at the script. What happens at a mic fixed in front of their mouth?',
    options: ['The voice moves off its axis and dulls', 'The arm swings the mic down with the head', 'The voice grows louder at the mic'],
    correct: 'The voice moves off its axis and dulls',
    explain: 'The mic stays where its arm holds it; the mouth tips down and away. The voice’s highs go out ahead of the mouth, so the mic hears a duller, quieter voice — move the mic or the script, not the host’s neck.',
    why: {
      'The arm swings the mic down with the head': 'An arm holds the mic still. Only a headset moves with the head.',
      'The voice grows louder at the mic': 'Reading down usually takes the mouth farther from the mic and off its axis: quieter and duller.',
    },
  },
  {
    id: 'b1.snd.2',
    page: 'sound',
    prompt: 'Why can a hard desk under the mouth colour a host’s voice at the mic?',
    options: ['It sends a later copy that cancels some pitches', 'It soaks up the voice’s low end on the way down', 'It turns the mic’s pattern into an omni'],
    correct: 'It sends a later copy that cancels some pitches',
    explain: 'The voice reaches the mic straight and, a little later, off the desk. Added together, some pitches cancel — a comb. A mic nearer the mouth and higher off the desk hears the bounce later and weaker.',
    why: {
      'It soaks up the voice’s low end on the way down': 'A hard desk reflects; it does not soak up the lows. The problem is the second, later copy.',
      'It turns the mic’s pattern into an omni': 'A surface nearby does not change the mic’s pattern; it adds a reflection.',
    },
  },
  {
    id: 'b1.snd.3',
    page: 'sound',
    prompt: 'Two hosts, both mics open. Why can one voice sound hollow in the mix?',
    options: ['It reaches both mics, the far one later', 'The far mic reverses that voice’s polarity', 'Two open mics make that voice twice as loud'],
    correct: 'It reaches both mics, the far one later',
    explain: 'Each voice reaches its own mic first and the other host’s mic a little later. Summed, some pitches cancel. Close mics, rears toward each other, and muting a mic no one uses keep it small.',
    why: {
      'The far mic reverses that voice’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'Two open mics make that voice twice as loud': 'The far copy is lower and later: it colours the sound more than it adds level.',
    },
  },
  voiceRatingCheck('b1.set.1', 'the host'),
  {
    id: 'b1.set.2',
    page: 'setting',
    prompt: 'A new mic is a long cylinder. How do you know where the host should speak into it?',
    options: ['Check its address side: its end, or a marked front', 'Speak into its long side, as you would on most mics', 'The end the cable comes out of'],
    correct: 'Check its address side: its end, or a marked front',
    explain: 'An end-address mic is spoken into along its body; a side-address mic into its marked front. The shape alone does not tell you — check the mic.',
    why: {
      'Speak into its long side, as you would on most mics': 'Many broadcast dynamics are end-address: spoken into the end. Check, do not guess.',
      'The end the cable comes out of': 'The cable leaves the back. The front is the other end — or a marked side.',
    },
  },
  {
    id: 'b1.set.3',
    page: 'setting',
    prompt: 'Before a live talk show, how do you bring the hosts’ mics up?',
    options: ['Each to its working level; at any ring, pull it down', 'Raise each one until it rings, then back off a little', 'Open them all at full level to test the system'],
    correct: 'Each to its working level; at any ring, pull it down',
    explain: 'With the responsible operator, bring each mic up only to its working level. At any ring, pull that channel down at once and fix the geometry or the open mics. Never raise a level to find feedback.',
    why: {
      'Raise each one until it rings, then back off a little': 'Provoking feedback risks ears and loudspeakers. Stop at the working level.',
      'Open them all at full level to test the system': 'Every open mic lowers the margin before feedback; full level on all of them invites it.',
    },
  },
  {
    id: 'b1.set.4',
    page: 'setting',
    prompt: 'A remote guest hears their own voice come back late. What is the routing doing?',
    options: ['Sending their own voice back in their return', 'Their microphone sits too close to their mouth', 'The hosts’ headphones are turned up too loud'],
    correct: 'Sending their own voice back in their return',
    explain: 'A remote guest’s return should be the program minus their own voice (mix-minus); otherwise they hear themselves late. Trace each destination before the show.',
    why: {
      'Their microphone sits too close to their mouth': 'Mic distance changes the tone, not what is sent back down the line.',
      'The hosts’ headphones are turned up too loud': 'The hosts’ headphones are a different destination from the guest’s return.',
    },
  },
  {
    id: 'b1.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic fixed on its arm, the host turns to a guest. What happens?',
    options: ['The mouth moves off the mic’s axis', 'The arm turns the mic to follow the head', 'Nothing: the distance stays the same'],
    correct: 'The mouth moves off the mic’s axis',
    explain: 'The arm holds the mic still while the head turns about its centre: the mouth moves away and off the axis — more so the closer the mic is.',
    why: {
      'The arm turns the mic to follow the head': 'A desk arm holds still; only someone moving it, or a headset, follows the head.',
      'Nothing: the distance stays the same': 'The mouth swings round the head’s centre, so its distance and angle to the mic change.',
    },
  },
  {
    id: 'b1.mic.1',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics still works?',
    options: ['The broadcast dynamic: it needs no power', 'The studio condenser, on a short cable', 'The condenser, once its screen is off'],
    correct: 'The broadcast dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. The condenser needs phantom power. Some dynamics need a lot of clean gain — check the manual for your preamp.',
    why: {
      'The studio condenser, on a short cable': 'Cable length does not power a condenser.',
      'The condenser, once its screen is off': 'The pop screen has nothing to do with power.',
    },
  },
  {
    id: 'b1.mic.2',
    page: 'microphone',
    prompt: 'When does the side-address condenser make sense for a host?',
    options: ['In a quiet room, spoken to its marked front', 'In a loud room, because it hears less of it', 'Spoken into its end, the same as the dynamic'],
    correct: 'In a quiet room, spoken to its marked front',
    explain: 'A side-address condenser is spoken to its marked front. It can sound detailed and open in a quiet, controlled room — and it hears that room.',
    why: {
      'In a loud room, because it hears less of it': 'Farther from the mouth and detailed, it hears more of a loud room, not less.',
      'Spoken into its end, the same as the dynamic': 'Side-address means its front is on its side: speaking into its end puts the voice off its axis.',
    },
  },
  {
    id: 'b1.mic.3',
    page: 'microphone',
    prompt: 'A close broadcast dynamic hears little of a noisy room. What does that?',
    options: ['Its pattern and how close it is', 'Its dynamic element, which ignores the room', 'Its heavy body, which blocks sound from behind'],
    correct: 'Its pattern and how close it is',
    explain: 'The voice against the room comes from distance and pattern. A close dynamic often helps in a poor room — because it is close and directional, not because it is dynamic.',
    why: {
      'Its dynamic element, which ignores the room': 'The transducer type does not filter out the room. Distance and pattern decide the balance.',
      'Its heavy body, which blocks sound from behind': 'The body does not block the room: the pattern does the rejecting, and a cardioid still hears the sides — the same as a cardioid condenser.',
    },
  },
  {
    id: 'b1.mic.4',
    page: 'microphone',
    prompt: 'What does the spring arm on the desk do for the host?',
    options: ['Holds the mic steady at a repeatable place', 'Turns the mic to follow the host’s head', 'Keeps the desk’s reflection out of the mic'],
    correct: 'Holds the mic steady at a repeatable place',
    explain: 'The arm puts the mic where the host sits naturally and holds it there, clear of the script and the sight line. Check its clamp, its load rating and the cable’s slack.',
    why: {
      'Turns the mic to follow the host’s head': 'An arm holds still; it does not follow the head.',
      'Keeps the desk’s reflection out of the mic': 'Lifting the mic away from the desk helps; the arm itself does not stop reflections.',
    },
  },
  {
    id: 'b1.place.1',
    page: 'placement',
    prompt: 'A starting point says “10–15 cm”. What is that measured from?',
    options: ['The lips, to the front of the mic', 'The chin, to the arm’s clamp', 'The desk top, to the mic’s grille'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so the distances start at the lips and end at the mic’s front — the windscreen of a broadcast dynamic, the face of a condenser.',
    why: {
      'The chin, to the arm’s clamp': 'The clamp holds the arm; the distance is from the lips to the mic.',
      'The desk top, to the mic’s grille': 'The desk is not where the voice leaves. Measure from the lips.',
    },
  },
  {
    id: 'b1.place.2',
    page: 'placement',
    prompt: 'You bring the broadcast dynamic from 15 cm to 6 cm. What tends to change?',
    options: ['More bass and breath, less of the room', 'More of the room, and less low end', 'Only the level changes, not the tone at all'],
    correct: 'More bass and breath, less of the room',
    explain: 'Closer, a directional mic gains bass (the proximity effect) and hears more breath and pops — and less of the room. Compare at matched loudness, so louder is not mistaken for better.',
    why: {
      'More of the room, and less low end': 'That is moving away. Closer means more voice against the room.',
      'Only the level changes, not the tone at all': 'A directional mic’s tone changes with distance: the proximity effect.',
    },
  },
  {
    id: 'b1.place.3',
    page: 'placement',
    prompt: 'Pops on every P and B. A first idea to try?',
    options: ['Move the mic a little off the breath line', 'Cut all the low end on the channel', 'Turn the mic so it faces away from the host'],
    correct: 'Move the mic a little off the breath line',
    explain: 'A small offset — a little above or to one side, still aimed at the mouth — or a pop screen keeps the air off the capsule. A filter cannot undo a pop that has already overloaded the input.',
    why: {
      'Cut all the low end on the channel': 'A deep cut thins the voice and does not stop a blast from overloading the capsule.',
      'Turn the mic so it faces away from the host': 'Aimed away, the mic hears the room instead of the voice.',
    },
  },
  {
    id: 'b1.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · An end-address mic: where does the host speak into it?',
    options: ['Into its end, along its body', 'Into its side, where it is widest', 'Into either side, as long as it is close'],
    correct: 'Into its end, along its body',
    explain: 'End-address means the capsule faces out of the end. Speaking into its side puts the voice off its axis.',
    why: {
      'Into its side, where it is widest': 'That is a side-address mic. An end-address mic is spoken into its end.',
      'Into either side, as long as it is close': 'Close but off the axis still sounds duller. Find the address side.',
    },
  },
  {
    id: 'b1.ctx.1',
    page: 'context',
    prompt: 'A live talk show, the PA at the stage’s front corner. A fair first step for the host’s mic?',
    options: ['Close, its rejection toward the PA', 'Farther back, for a more open voice', 'Turned up until it is louder than the PA'],
    correct: 'Close, its rejection toward the PA',
    explain: 'Live, the audience hears the PA as it happens, and every open mic hears it too. A close mic keeps the voice ahead; aim the pattern’s rejection toward the loudspeaker; keep unused mics closed.',
    why: {
      'Farther back, for a more open voice': 'Farther from the mouth, the mic hears more PA against the voice — less margin before feedback.',
      'Turned up until it is louder than the PA': 'More gain brings feedback closer. Move the mic, not the gain.',
    },
  },
  superNull('b1.ctx.2', 'context', 'PA'),
  {
    id: 'b1.ctx.studio',
    page: 'context',
    prompt: 'Two hosts in a quiet studio, on headphones, a desk between them. What is a fair first setup?',
    options: ['A close mic each, each on its own channel', 'One mic between them, halfway across the desk', 'A loudspeaker between them so both can hear'],
    correct: 'A close mic each, each on its own channel',
    explain: 'In the studio, headphones and the loudspeakers off keep the program out of the mics. A mic each, close and aimed at its own host, on separate channels, is a place to begin.',
    why: {
      'One mic between them, halfway across the desk': 'Halfway, it is far from both mouths: more room, and no way to balance the two voices.',
      'A loudspeaker between them so both can hear': 'A loudspeaker near open mics feeds the program back into them. Use headphones.',
    },
  },
  {
    id: 'b1.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Two hosts, both mics open. What does each mic hear besides its own host?',
    options: ['The other host, later and lower', 'Nothing else, because each is cardioid', 'Only the room, not the other host'],
    correct: 'The other host, later and lower',
    explain: 'The other voice is farther away and off the back of the pattern — lower, but later. That is bleed: it can colour the mix, and no rule makes it zero.',
    why: {
      'Nothing else, because each is cardioid': 'A cardioid rejects most behind, but not all of it — and the room carries the other voice too.',
      'Only the room, not the other host': 'The other host is a loud source a metre or so away: their voice reaches the mic.',
    },
  },
  {
    id: 'b1.two.1',
    page: 'twoMic',
    prompt: 'The host’s voice sounds hollow with both mics open. Why?',
    options: ['It reaches the second host’s mic later', 'The second mic reverses its polarity', 'The closer mic is louder, so it cancels'],
    correct: 'It reaches the second host’s mic later',
    explain: 'The host’s voice reaches their own mic first and the second host’s mic later. Summed, some pitches arrive out of step and cancel — a comb.',
    why: {
      'The second mic reverses its polarity': 'Distance delays a sound; it does not flip its sign.',
      'The closer mic is louder, so it cancels': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b1.two.2'),
  {
    id: 'b1.two.3',
    page: 'twoMic',
    prompt: 'The second host is quiet for a long stretch. A fair step for their mic?',
    options: ['Mute it, or pull it down, until they speak', 'Turn it up so it catches more of the room sound', 'Swap it for an omni so it hears both'],
    correct: 'Mute it, or pull it down, until they speak',
    explain: 'A mic no one is using only adds the other voice later, the room and — live — less margin before feedback. Mute it or pull it down; check that soft first words are not lost.',
    why: {
      'Turn it up so it catches more of the room sound': 'More gain on an unused mic adds bleed and room, not voice.',
      'Swap it for an omni so it hears both': 'An omni hears the other host even more: more bleed, more comb.',
    },
  },
  {
    id: 'b1.two.4',
    page: 'twoMic',
    prompt: 'Why keep each host on their own channel?',
    options: ['Each can be checked and balanced alone', 'Two channels make both voices louder', 'So the two mics form a stereo pair'],
    correct: 'Each can be checked and balanced alone',
    explain: 'On separate channels each voice can be soloed, levelled, muted when silent and checked in mono with the other. A sum made at the source cannot be undone.',
    why: {
      'Two channels make both voices louder': 'Level comes from gain, not from channels.',
      'So the two mics form a stereo pair': 'They are two separate close mics, not a stereo pair.',
    },
  },
  {
    id: 'b1.prac.gain',
    page: 'practice',
    prompt: 'The host’s laugh lights the overload light; normal speech sits well below it. What do you do?',
    options: ['Lower the input gain and check the laugh again', 'Pull the channel fader down until the laugh is clean', 'Ask the host not to laugh during the show'],
    correct: 'Lower the input gain and check the laugh again',
    explain: 'Set gain on the loudest plausible speech, laugh and shout, with headroom at the preamp, the interface and every stage after. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the laugh is clean': 'The overload is at the input, before the fader: a lower fader only makes the clipped sound quieter.',
      'Ask the host not to laugh during the show': 'The show is the host’s; set gain for what they really do.',
    },
  },
  {
    id: 'b1.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic for one host?',
    options: ['A need the first mic cannot meet, on its own channel', 'More mics make the voice sound fuller, so add a second', 'The voice needs more level than one mic gives'],
    correct: 'A need the first mic cannot meet, on its own channel',
    explain: 'A backup for a live show, or a headset when the host leaves the desk — each earns its place for a reason, on its own channel, checked in mono. Two open mics on one voice comb.',
    why: {
      'More mics make the voice sound fuller, so add a second': 'Two mics on one voice usually sound hollower, not fuller.',
      'The voice needs more level than one mic gives': 'Level comes from gain and distance, not from another mic.',
    },
  },
  {
    id: 'b1.mix.1',
    page: 'practice',
    prompt: 'A mic sits low over a hard desk, the voice sounds hollow. A first idea to try?',
    options: ['Raise the mic off the desk, nearer the mouth', 'Boost the treble to bring back the lost clarity', 'Turn the mic’s pattern to omni'],
    correct: 'Raise the mic off the desk, nearer the mouth',
    explain: 'Nearer the mouth and farther from the desk, the desk’s copy arrives later and weaker. A soft cloth on the desk is another idea. EQ cannot put back a cancelled pitch.',
    why: {
      'Boost the treble to bring back the lost clarity': 'A comb is cancellation between two copies: EQ cannot fill its notches.',
      'Turn the mic’s pattern to omni': 'An omni hears the desk’s bounce at least as well.',
    },
  },
  {
    id: 'b1.mix.2',
    page: 'practice',
    prompt: 'On a live show, why mute a guest mic that nobody is using?',
    options: ['Each open mic lowers the margin before feedback', 'A muted mic sounds warmer when it is opened again', 'The guest might speak too loudly into it'],
    correct: 'Each open mic lowers the margin before feedback',
    explain: 'Every open mic hears the PA and the room: each doubling of open mics costs about 3 dB of gain before feedback. Keep only the needed mics open.',
    why: {
      'A muted mic sounds warmer when it is opened again': 'Muting does not change a mic’s tone.',
      'The guest might speak too loudly into it': 'Level is handled with gain. The open mic’s cost is margin and bleed.',
    },
  },
  removeDelayVoice('b1.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b1.sym.boom',
    observation: 'The host sounds boomy and thick',
    firstChecks: 'How close is the mic? Is the host leaning in? A directional mic gains bass close up.',
    options: ['Ease the mic back a little; keep the posture', 'Turn the channel up so the words cut through', 'Swap to a mic with a bigger foam windscreen on it'],
    correct: 'Ease the mic back a little; keep the posture',
    explain: 'Very close, the proximity effect builds the low end. Move the mic back a little and compare at matched loudness before reaching for a low cut.',
    why: {
      'Turn the channel up so the words cut through': 'More gain raises the boom with the words.',
      'Swap to a mic with a bigger foam windscreen on it': 'A windscreen does not change the proximity effect.',
    },
  },
  {
    id: 'b1.sym.pops',
    observation: 'Pops on P and B',
    firstChecks: 'Is the capsule in the breath stream? Is there a pop screen or windscreen? Is the host very close?',
    options: ['Offset the mic a little; add a pop screen', 'Cut all of the low end on the host’s channel', 'Turn the host’s headphones down a little'],
    correct: 'Offset the mic a little; add a pop screen',
    explain: 'A small offset above or to one side, still aimed at the mouth, or a pop screen keeps the air off the capsule. A filter cannot repair a pop that overloaded the input.',
    why: {
      'Cut all of the low end on the host’s channel': 'A deep cut thins the voice and leaves the blast at the capsule.',
      'Turn the host’s headphones down a little': 'Headphone level does not move the breath stream.',
    },
  },
  {
    id: 'b1.sym.room',
    observation: 'The host sounds distant and roomy',
    firstChecks: 'Is the mic too far, or is the host turned away or reading down? Is it aimed at the mouth?',
    options: ['Bring the mic closer, aimed at the mouth', 'Add reverb removal to the track later', 'Raise the gain until the voice is up front'],
    correct: 'Bring the mic closer, aimed at the mouth',
    explain: 'Distance and aim decide the voice against the room. Bring the mic to the host’s natural position; move the script so they do not read away from it.',
    why: {
      'Add reverb removal to the track later': 'Processing cannot fully recover a dry voice from a distant mic. Move the mic first.',
      'Raise the gain until the voice is up front': 'Gain raises the room as much as the voice.',
    },
  },
  {
    id: 'b1.sym.thump',
    observation: 'Thumps when the desk is tapped or a page turns',
    firstChecks: 'Is the arm touching the desk or the papers? Is there a shock mount? Is the cable pulling?',
    options: ['Isolate the mic: suspension, slack, clear of papers', 'Cut the low end hard on the channel and hope it goes', 'Ask the host to sit very still through the whole show'],
    correct: 'Isolate the mic: suspension, slack, clear of papers',
    explain: 'Structure noise travels through the desk and the arm. A suitable suspension, a cable with slack and a mic clear of the papers stop it at the source; a low filter is a last step.',
    why: {
      'Cut the low end hard on the channel and hope it goes': 'A deep cut thins the voice and leaves the cause.',
      'Ask the host to sit very still through the whole show': 'The host should sit naturally. Isolate the mic instead.',
    },
  },
  {
    id: 'b1.sym.feedback',
    observation: 'Live: the PA rings when the host leans back',
    firstChecks: 'Lower the level at once. Is the mic now farther from the mouth? Too many open mics? Where is the PA against the pattern?',
    options: ['Lower the level, then fix the distance and open mics', 'Turn the host’s mic up so it stays over the ringing', 'Swap the host’s mic for an omni so it hears the room'],
    correct: 'Lower the level, then fix the distance and open mics',
    explain: 'Feedback is a sound-system condition: lower the send first, then bring the mic back to the mouth, close unused mics and put the PA in the pattern’s rejection. Never provoke feedback on purpose.',
    why: {
      'Turn the host’s mic up so it stays over the ringing': 'More gain feeds the loop.',
      'Swap the host’s mic for an omni so it hears the room': 'An omni hears the PA from every side: feedback comes sooner.',
    },
  },
  hollowVoiceSymptom('b1.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b1.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a host’s mic setup in the order you would do them.',
    steps: [
      { text: 'Listen to the host and the room; quiet the noise sources', early: 'Start with the host and the room, before any equipment.' },
      { text: 'Find the mic’s address side and choose the mount', early: 'Know the mic before you place it.' },
      { text: 'Place it at a starting distance from the lips, clear of the sight line', early: 'Place the mic once you know its address side.' },
      { text: 'Set gain on the loudest real speech and laugh, with headroom', early: 'Gain comes once the mic is placed.' },
      { text: 'Check pops, the desk, page turns and head turns', early: 'Check the details once the level is set.' },
      { text: 'Add a second host on their own channel; test an overlap', early: 'Add the second host after the first is set.' },
      { text: 'Trace every route; live, bring mics up to working level only', early: 'Routing and the live check come last.' },
    ],
    explain: 'A sensible order. Phantom power: mute the outputs first and follow your own equipment’s manual. Live: never raise a level to find feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b1.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A two-host podcast in a small, fairly quiet room with a hard desk, both hosts on headphones.',
    setups: [
      { id: 'a', label: 'A broadcast dynamic each on an arm, about 10–15 cm, rears toward each other', ok: true, power: 'none', feedback: 'A recommended start: close, each on its own channel — check the overlap in mono and the desk’s bounce.' },
      { id: 'b', label: 'A screened condenser each, about 15–20 cm, a soft cloth on the desk', ok: true, power: 'phantom', feedback: 'A recommended start for a quiet room — check the room and the other host in each mic.' },
      { id: 'c', label: 'One mic between them in the middle of the desk', ok: false, power: 'phantom', feedback: 'Far from both mouths: more room, more desk, no way to balance the two voices.' },
      { id: 'd', label: 'Each mic low over the desk, aimed up at the chin', ok: false, power: 'none', feedback: 'Low over the desk it hears the bounce strongly, and the chin is not where the voice leaves.' },
      { id: 'e', label: 'A loudspeaker on the desk so both hosts can hear', ok: false, power: 'none', feedback: 'A loudspeaker near open mics feeds the program back in. Use headphones.' },
    ],
    reasons: [docReason('the lips'), clearReason('the host’s face, the sight line and the papers'), { id: 'r.channel', label: 'Each host is on their own channel, checked alone and in mono', role: 'required', feedback: 'Say how the two voices are kept apart.' }, { id: 'r.three', label: 'The 3:1 rule guarantees no bleed at this desk', role: 'wrong', feedback: '3:1 can help with spaced mics; it is not a guarantee at a talking desk.' }, BRAND_REASON('host'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, clear of the face and the papers, each host on their own channel, checked in mono — and no promise of zero bleed.',
  },
  {
    id: 'b1.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A live talk show: one host at a desk on a stage, an audience and a PA, a stream and a recorder.',
    setups: [
      { id: 'a', label: 'A broadcast dynamic close on an arm, its rejection toward the PA', ok: true, power: 'none', feedback: 'A recommended start: close enough to stay ahead of the PA — check the margin with the PA on.' },
      { id: 'b', label: 'A supercardioid close, the PA a little to one side of its rear', ok: true, power: 'none', feedback: 'A recommended start — check the actual pattern against the PA’s place.' },
      { id: 'c', label: 'A condenser farther back, for a more natural voice', ok: false, power: 'phantom', feedback: 'Farther back, it hears more of the PA against the voice: less margin before feedback.' },
      { id: 'd', label: 'Every spare mic on the desk left open in case', ok: false, power: 'none', feedback: 'Each open mic adds the PA and the room. Keep only the needed mics open.' },
      { id: 'e', label: 'Raise the host’s mic until it rings, then back off', ok: false, power: 'none', feedback: 'Never provoke feedback. Bring each mic to its working level only.' },
    ],
    reasons: [docReason('the lips'), clearReason('the host’s face and hands'), { id: 'r.paths', label: 'The stream, the recorder, the headphones and the PA are traced as separate routes', role: 'required', feedback: 'Say how each destination is checked.' }, { id: 'r.null', label: 'The pattern’s rejection faces the PA', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('talk show'), { id: 'r.loudest', label: 'Turn it up until the voice is louder than the PA', role: 'wrong', feedback: 'More gain brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a close mic measured from the lips, the PA toward the rejection, the fewest open mics, and every route traced — with no feedback provoked.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a host’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then turn the head, try the desk and open the second mic.' },
  microphone: { prompt: 'Before you move anything: which mic needs phantom power?', options: ['The broadcast dynamic', 'The studio condenser', 'Both of them'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you bring the broadcast dynamic from 15 cm to 6 cm. What changes?', options: ['More bass and breath', 'More room', 'It depends on this host'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is in front of the desk, facing the audience. Where will a supercardioid aimed at the host reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the second host’s mic polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A mic sits low over a hard desk. What does the desk add at the mic?',
    options: ['A later copy of the voice that cancels some pitches', 'Nothing: a desk below the mouth is out of the way', 'More low end, because the desk resonates with the voice'],
    correct: 'A later copy of the voice that cancels some pitches',
    explain: 'The voice reaches the mic straight and off the desk, a little later: some pitches cancel. Nearer the mouth and higher off the desk, the bounce matters less.',
    why: {
      'Nothing: a desk below the mouth is out of the way': 'A hard desk reflects the voice up into the mic.',
      'More low end, because the desk resonates with the voice': 'The main effect is the reflection’s later copy, not a resonance.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'The host turns to a guest; the mic stays on its arm. Which mic changes most?',
    options: ['A very close one: the same turn is a bigger change', 'A farther one, since it was already the quieter one', 'Neither: an arm keeps the mic aimed at the mouth'],
    correct: 'A very close one: the same turn is a bigger change',
    explain: 'The mouth swings round the head’s centre by much the same amount; at a close mic that is a bigger share of the distance and angle — a bigger change in level and tone.',
    why: {
      'A farther one, since it was already the quieter one': 'Farther away, the same movement is a smaller share of the distance.',
      'Neither: an arm keeps the mic aimed at the mouth': 'An arm holds still; the mouth moves.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'Before a live show, how do you check the hosts’ mics with the PA on?',
    options: ['Each up to its working level only; any ring, pull it down', 'Raise each until it rings to find the limit, then back off', 'Open them all at once at a high level to test the system'],
    correct: 'Each up to its working level only; any ring, pull it down',
    explain: 'Never provoke feedback: bring each mic to its working level with the responsible operator, and at any ring pull it down at once and fix the geometry.',
    why: {
      'Raise each until it rings to find the limit, then back off': 'Provoking feedback risks ears and loudspeakers.',
      'Open them all at once at a high level to test the system': 'Many open mics at a high level invite feedback.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'How do you find where to speak into a broadcast mic?',
    options: ['Check its address side: its end or a marked front', 'Speak into the long side, as you would with most mics', 'The end that the cable comes out of'],
    correct: 'Check its address side: its end or a marked front',
    explain: 'End-address mics are spoken into their end; side-address mics into a marked front. The shape does not tell you.',
    why: {
      'Speak into the long side, as you would with most mics': 'Many broadcast mics are end-address. Check the mic.',
      'The end that the cable comes out of': 'The cable leaves the back of the mic.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What should a remote guest hear in their return?',
    options: ['The program without their own voice', 'The whole program, their voice included', 'Only the hosts, with no clips at all'],
    correct: 'The program without their own voice',
    explain: 'Mix-minus: the program minus the guest’s own voice, so they do not hear themselves late.',
    why: {
      'The whole program, their voice included': 'They would hear their own voice come back late — distracting, and an echo risk.',
      'Only the hosts, with no clips at all': 'They can hear the clips too; only their own voice is left out.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA loudspeaker at the stage’s front corner',
    short: 'PA',
    p: { x: PA_C.x, y: SEATED_FLOOR, z: PA_C.z },
    lift: SEATED_FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'On a pole at the stage’s front corner, facing the audience: its back and side spill toward the desk — behind a mic aimed at the host, and off to one side.',
    prov: { kind: 'illustrative', reason: 'a typical small stage: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B01_LESSON: Lesson = {
  id: 'B01',
  labId: 'broadcast',
  title: 'Radio, Podcast and Studio Hosts',
  subtitle: 'A broadcast dynamic about 10–15 cm from the lips on a desk arm — a mic and a channel for each host',
  noun: { one: 'host', many: 'hosts', subject: 'host', person: true },
  model: B01_MODEL,
  micTypeIds: ['bcDynArm', 'bcDynSuper', 'bcLdcArm'],
  zones: B01_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A host speaking at a desk — on the radio, on a podcast, in a studio or on a live talk show. The voice leaves through the mouth; the desk, the arm, the script and the other people decide where a mic can go.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Radio and podcast studios, streaming desks, live talk programs: a mic on a desk arm in front of each host, headphones on, a laptop and a script on the desk.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It keeps each host intelligible, close and steady in level and tone — through reading, turning, laughing and talking over each other.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT DISTANCE', text: 'Different mics, patterns, voices and rooms call for different working distances. Begin within the mic’s own guidance, let the host sit naturally, and adjust by listening. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, quiet or emphatic.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; S and T send a narrow hiss forward. A close desk mic in that path hears pops and harsh S sounds — a small offset above or to one side, or a pop screen, keeps them off the capsule.',
    body: 'The vowels carry most of the level and the tone. Close to a directional mic they gain low end (the proximity effect); farther, more of the room and the other host join in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'host', label: 'the host', short: 'HOST', note: 'Seated at the desk, the mouth at the point every distance is read from. The head turns, reads down and leans back.', prov: { kind: 'illustrative', reason: 'the shared figure seated (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'desk', label: 'the desk under the mouth', short: 'DESK', note: 'A hard surface 45 cm below the lips: it reflects the voice back up into the mic. Keep the capsule away from it where you can.', prov: { kind: 'illustrative', reason: 'the lesson L18; desk height a drawing default' }, tag: 'REFLECTION', scene: 'all' },
      { id: 'hostB', label: 'the second host', short: 'HOST 2', note: 'Across the desk, about 1.5 m away: their voice reaches the host’s mic later and lower. A mic each, rears toward each other.', prov: { kind: 'illustrative', reason: 'the lesson L26; the spacing a drawing default' }, tag: 'BLEED', scene: 'studio' },
      { id: 'noise', label: 'fans, air conditioning, chair and arm noise', short: 'NOISE', note: 'Find them before any mic: the laptop fan, the vents, a creaking chair, a page turn. Reduce them at the source.', prov: { kind: 'illustrative', reason: 'the lesson L5, L24' }, tag: 'NOISE', scene: 'all' },
      { id: 'phones', label: 'the headphones', short: 'HEADPHONES', note: 'Closed-back headphones at a comfortable level, the loudspeakers off: the program stays out of the mics.', prov: { kind: 'illustrative', reason: 'the lesson L28' }, tag: 'SPILL', scene: 'studio' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'Live: it faces the audience, but every open mic hears it. Fewest open mics, the pattern’s rejection toward it.', prov: { kind: 'illustrative', reason: 'a typical small stage' }, tag: 'FEEDBACK', scene: 'stage' },
    ],
    stage: 'LIVE SHOW: a broadcast dynamic close on its arm, the PA toward the pattern’s rejection, the fewest open mics, every route traced. Never provoke feedback.',
    studio: 'STUDIO: a mic each, about 10–15 cm for a broadcast dynamic or 15–20 cm for a condenser, headphones on, each host on their own channel.',
  },
  diagnostic,
  practice: {
    task: 'Choose a host’s setup for a two-host podcast and for a live talk show, describe an alternative, and explain what would justify a second mic. With a real host and their agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Program and room', kind: 'text' },
      { id: 'mic', label: 'Mic, pattern and address side', kind: 'choice', choices: ['broadcast dynamic, end-address', 'studio condenser, side-address', 'supercardioid dynamic', 'other'] },
      { id: 'distance', label: 'Mouth distance and angle', kind: 'text' },
      { id: 'mount', label: 'Mount and the desk’s reflection', kind: 'text' },
      { id: 'routes', label: 'Headphone, stream and PA routes', kind: 'text' },
      { id: 'notes', label: 'Tone, noise, bleed and decision (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The seated host: the lips 450 mm above a 740 mm desk (the floor 1190 mm below the lips), the seat, the forearms on the desk — drawing defaults; the head is the voice family’s.', dims: ['yFloor'] },
    { text: 'The broadcast dynamic’s size (190 mm long, 60 mm across), the desk arm’s segments (420 and 400 mm) and its clamp post, the condenser’s shock mount — drawing defaults; no outline was read.', dims: [] },
    { text: 'The desk (about 1.4 m deep, 1.3 m wide, its front edge 6 cm ahead of the lips), the second host’s place (1.5 m lip to lip), the clamps, the laptops and the script; the PA’s place (2.6 m out, 1.1 m to the host’s left) — drawing defaults.', dims: [] },
    { text: '“A very slight angle” off the breath stream: 10–20° above the mouth’s axis (the proposal’s 15° default). The head turns about its centre (a simplified picture); the turn limits are drawing defaults.', dims: [] },
    { text: 'The desk reflection is drawn as a hard, flat mirror and the mouth as one point (a simplified picture): read where the first dip falls, not its depth.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every host, mic, desk and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a host in a typical seated pose, the desk’s reflection as a mirror, mic patterns and the two-mic comb as textbook shapes, the 3:1 rule as a note, never a test. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Live: never provoke feedback.',
  copy: B01_COPY,
};
