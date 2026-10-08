/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B07-Voiceover-Narration-and-Broadcast-Guests-Miking-Technique
 * .txt, cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md ("L7G1") applied: the institutional
 * wording (B-INST: L2, L47), and no in-app link to the not-yet-built body-mic
 * lesson (B-XLINK: L24 "Cross-link B05").
 *
 * A reader in a booth and a guest at a desk, the SET-UP as the variant
 * (WHERE: BOOTH / GUEST DESK), on the voice family (frame V) and the seated
 * talker (shared/broadcast). OWNER RULING 2026-10-04: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingDiag, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { hollowVoiceSymptom, personMeet, voiceRatingCheck } from '../shared/broadcast/voiceItems.ts';
import { DESK_TOP_Y, SEATED_FLOOR } from '../shared/broadcast/talkerPose.ts';
import { B07_MODEL, MONITOR_C } from './geometry.ts';
import { B07_ZONES } from './model.ts';
import { B07_COPY } from './copy.ts';

const W: Words = { noun: 'voice-over', player: 'reader', moving: 'the head, the hands and the pages' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the reader and the script',
    goal: 'Get to know a reader at a script stand and a guest at a desk — where the voice leaves, the script, the booth, the headphones — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; the script, the booth and the person across the desk decide what else the mic hears.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the reader, what looking down to the script does at a fixed mic, and how the script stand sends a later copy of the voice to the mic.',
    credit: { scenarios: ['b7.snd.1', 'b7.snd.2', 'b7.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. Reading down takes the voice off a mic in front; a hard stand adds a later copy; close or above the script, that copy matters less. Tendencies, and readers vary.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Choose the perspective, listen to the room, check a remote guest’s real mic and return, and keep loudspeakers out of open mics — before any mic goes up.',
    credit: { scenarios: ['b7.set.1', 'b7.set.2', 'b7.set.3', 'b7.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Decide close or moderate first; listen to the real room; give a remote guest headphones, their own chosen mic and a return without their own voice; never provoke feedback.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a reader’s or a guest’s mic by its properties and its distance — a broadcast dynamic, a studio condenser, a headset — not by its name or by “dynamic means no room”.',
    credit: { scenarios: ['b7.mic.1', 'b7.mic.2', 'b7.mic.3', 'b7.mic.4', 'b7.rec.1'], note: 'Answer the five checks (one reaches back to the reader and the script).' },
    takeaway: 'Compare mics at usable positions and levels. Distance and pattern decide the voice against the room; a headset keeps a turning guest steady; an omni has no proximity bass but hears all round.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we suggest you begin — a broadcast dynamic about 10 cm from the lips in the booth, about 11 cm at the guest desk — then move the mic and see what changes.',
    credit: { scenarios: ['b7.place.1', 'b7.place.2', 'b7.place.3', 'b7.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the reader, inside two different suggested starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A suggested zone is a place to begin, measured from the lips — not a rule. Close versus moderate is a choice of perspective that the room must support; clearance from the face and the script comes first.',
  },
  context: {
    title: 'Booth or desk',
    goal: 'See where a monitor loudspeaker sits against a desk mic’s pattern — and why the talent hears on headphones and the monitor stays off while the mics are open.',
    credit: { scenarios: ['b7.ctx.1', 'b7.ctx.2', 'b7.ctx.studio', 'b7.rec.3'], interactive: 'wedgeInNull', note: 'GUEST DESK: aim the mic (or change its pattern) until the monitor sits in the rejection. BOOTH: answer the decision card. Then the three checks.' },
    takeaway: 'A studio narration can use the room on purpose; a live read favours a close, repeatable place. Loudspeakers stay out of open mics: headphones for the talent, and a pattern’s rejection is only a help.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a host’s and a guest’s open mics can make a voice sound hollow, how the arrival-time difference places comb notches, and why each stays on their own channel.',
    credit: { scenarios: ['b7.two.1', 'b7.two.2', 'b7.two.3', 'b7.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each voice reaches the other mic later and lower: the sum cancels some pitches. A mic each, close, the unused one muted; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the distance, the angle to the mouth, the script, the room, the guest’s real input, the return — before reaching for EQ or noise reduction.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a reader’s mic in the right order, choose and justify a setup for a dry announcer read and for a guest joining from home, and say what would justify a second mic.',
    credit: { scenarios: ['b7.prac.order', 'b7.prac.gain', 'b7.prac.setup1', 'b7.prac.setup2', 'b7.prac.3', 'b7.mix.1', 'b7.mix.2', 'b7.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The placement sheet is optional — it needs a real reader.' },
    takeaway: 'A repeatable place measured from the lips, plosive and proximity control, close or moderate justified by the room, the guest’s real mic checked and a clean return pass. A brand or a louder take do not — and more than one setup can pass.',
  },
};
/** MEET IT in person words (review 2026-10-08, L7G2-18 / L7G3-17): the engine's goal calls the subject "it". */
pages.meet = personMeet(pages, 'the reader and the guest');

/*
 * THE CHECKS. Lesson lines in comments only: b7.snd.* L21–L22, L30 · b7.set.*
 * L5–L6, L35–L39 · b7.mic.* L27–L28, L31 · b7.place.* L12–L21 · b7.ctx.*
 * L37–L39 · b7.two.* L34 · b7.prac.* / b7.mix.* L32, L41–L47.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b7.snd.1',
    page: 'sound',
    prompt: 'The reader looks down at the script on the stand. What happens at a mic fixed in front of their mouth?',
    options: ['The voice tips off its axis and dulls', 'The mic hears the voice more clearly from below', 'Nothing changes while the distance is the same'],
    correct: 'The voice tips off its axis and dulls',
    explain: 'Looking down tips the mouth’s axis toward the page. The voice’s highs go out ahead of the mouth, so a mic in front hears a duller voice — raise the script or move the mic, not the reader’s neck.',
    why: {
      'The mic hears the voice more clearly from below': 'The mic is not below the mouth’s new axis — the axis now points at the page.',
      'Nothing changes while the distance is the same': 'The angle matters as much as the distance: off the axis the voice dulls.',
    },
  },
  {
    id: 'b7.snd.2',
    page: 'sound',
    prompt: 'Why can a hard script stand close to the mouth colour the voice at the mic?',
    options: ['It sends a later copy that cancels some pitches', 'It soaks up the voice’s high end like a soft panel', 'It turns the voice into a hiss above the stand'],
    correct: 'It sends a later copy that cancels some pitches',
    explain: 'The voice reaches the mic straight and, a little later, off the stand: some pitches cancel. Tilt the stand, keep the mic close, or put it above the script.',
    why: {
      'It soaks up the voice’s high end like a soft panel': 'A hard stand reflects rather than absorbs; the problem is the second copy.',
      'It turns the voice into a hiss above the stand': 'A reflection does not change the voice into a hiss; it adds a later copy.',
    },
  },
  {
    id: 'b7.snd.3',
    page: 'sound',
    prompt: 'A mic above the script, at about eye level, aimed down at the mouth. What does it tend to help with?',
    options: ['The view of the script and the paper’s reflection', 'More bass, from a closer and more direct voice', 'Hearing more of the booth than of the voice'],
    correct: 'The view of the script and the paper’s reflection',
    explain: 'Above the script, the reader looks under it to the page, and the stand’s reflection reaches it less. Check how the voice sounds a little off the mic’s axis, and that the mount is firm.',
    why: {
      'More bass, from a closer and more direct voice': 'It is not closer — about 20–30 cm away — so less proximity bass, not more.',
      'Hearing more of the booth than of the voice': 'Aimed at the mouth, it still hears mostly the voice.',
    },
  },
  voiceRatingCheck('b7.set.1', 'the reader'),
  {
    id: 'b7.set.2',
    page: 'setting',
    prompt: 'A narration for a calm documentary in a good-sounding room. When is a moderate distance fair?',
    options: ['When the room is worth hearing in the voice', 'Whenever the reader prefers to stand back', 'When the booth is noisy and needs drowning out'],
    correct: 'When the room is worth hearing in the voice',
    explain: 'Moderate distance brings more of the room relative to the voice — a natural narration if the room supports it. In a poor or noisy room, closer usually helps.',
    why: {
      'Whenever the reader prefers to stand back': 'The reader’s comfort matters, but the room decides whether the moderate perspective works.',
      'When the booth is noisy and needs drowning out': 'Farther away, the noise is louder against the voice. Get closer in a noisy room.',
    },
  },
  {
    id: 'b7.set.3',
    page: 'setting',
    prompt: 'A remote guest has a good external mic, but they sound distant and roomy. A first thing to check?',
    options: ['Which mic the app has chosen as the input', 'Whether their room lights are bright enough', 'How loudly their headphones are playing'],
    correct: 'Which mic the app has chosen as the input',
    explain: 'A good external mic is no use if the laptop’s own mic is the active input. Confirm the chosen input and monitor device with the guest before the show.',
    why: {
      'Whether their room lights are bright enough': 'Lighting is a picture matter. The sound points to the wrong input or a distant mic.',
      'How loudly their headphones are playing': 'Headphone level does not change which mic is used.',
    },
  },
  {
    id: 'b7.set.4',
    page: 'setting',
    prompt: 'How do you check a reader’s mic before a session?',
    options: ['With their real voice at the real level', 'By blowing into it to see that it works', 'Raise the level until it starts to ring'],
    correct: 'With their real voice at the real level',
    explain: 'Use the real voice: soft, normal and emphatic lines. Never blow into a capsule and never provoke feedback to test a mic.',
    why: {
      'By blowing into it to see that it works': 'Blowing into a capsule can harm it and tells you nothing about the voice.',
      'Raise the level until it starts to ring': 'Provoking feedback risks ears and loudspeakers. Never test that way.',
    },
  },
  {
    id: 'b7.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where is every distance in this lesson measured from?',
    options: ['The lips, to the front of the mic', 'The eyes, to the script on the stand', 'The chest, to the mic’s mount'],
    correct: 'The lips, to the front of the mic',
    explain: 'The voice leaves at the mouth, so every starting point runs from the lips to the front of the mic.',
    why: {
      'The eyes, to the script on the stand': 'That is the reading distance, not the mic distance.',
      'The chest, to the mic’s mount': 'The voice leaves at the mouth, not the chest.',
    },
  },
  {
    id: 'b7.mic.1',
    page: 'microphone',
    prompt: 'A broadcast dynamic close to the reader hears little of a noisy booth. Why?',
    options: ['Its pattern, and how close it is', 'Its dynamic element ignores the room', 'Dynamics hear only from straight ahead'],
    correct: 'Its pattern, and how close it is',
    explain: 'The voice against the room comes from distance and pattern. A close directional mic helps in a poor room whatever its transducer.',
    why: {
      'Its dynamic element ignores the room': 'The transducer does not filter the room; distance and pattern do.',
      'Dynamics hear only from straight ahead': 'A cardioid dynamic hears the sides too, less at the rear.',
    },
  },
  {
    id: 'b7.mic.2',
    page: 'microphone',
    prompt: 'An omni mic close to the mouth. What is true of its low end?',
    options: ['No proximity bass, but it hears all round', 'More bass close up than a cardioid ever gives', 'No low end at all, so it sounds thin'],
    correct: 'No proximity bass, but it hears all round',
    explain: 'A pressure omni has no pressure-gradient proximity effect, and it is less fussy about small movements — but it hears from every direction.',
    why: {
      'More bass close up than a cardioid ever gives': 'Proximity bass belongs to directional (pressure-gradient) mics, not an omni.',
      'No low end at all, so it sounds thin': 'An omni hears the low end fine; it just does not add proximity bass.',
    },
  },
  {
    id: 'b7.mic.3',
    page: 'microphone',
    prompt: 'A guest turns between the host and a screen while they talk. Which mic keeps their distance steady?',
    options: ['A headset, which moves with the head', 'A mic on a stand far in front of them', 'A boundary mic flat on the desk'],
    correct: 'A headset, which moves with the head',
    explain: 'A headworn mic keeps one place by the mouth as the head turns. Check comfort, how it looks on camera, and that it is the program mic.',
    why: {
      'A mic on a stand far in front of them': 'A distant fixed mic hears every turn as a change — and more of the room.',
      'A boundary mic flat on the desk': 'Low and far from the mouth, it hears turns, the desk and the room.',
    },
  },
  {
    id: 'b7.mic.4',
    page: 'microphone',
    prompt: 'How do you match a studio guest to the host?',
    options: ['Place, distance and level at the program', 'Buy the exact same model for each guest', 'Make the guest sit as far from their mic as the host'],
    correct: 'Place, distance and level at the program',
    explain: 'Placement, room, distance and speech level often matter more than the printed mic name. Compare the two voices at the actual program destination.',
    why: {
      'Buy the exact same model for each guest': 'The same model at a different place and level still sounds different.',
      'Make the guest sit as far from their mic as the host': 'Matching distance helps, but only with level and placement checked at the program.',
    },
  },
  {
    id: 'b7.place.1',
    page: 'placement',
    prompt: 'You move the screened condenser from 25 cm to 12 cm. What tends to change?',
    options: ['More breath and bass, less of the room', 'More room and a more open, airy voice', 'Only the level, the tone stays the same'],
    correct: 'More breath and bass, less of the room',
    explain: 'Closer, a directional mic gains bass (proximity) and hears more breath and mouth noise — and less of the room. Compare at matched loudness.',
    why: {
      'More room and a more open, airy voice': 'That is moving away. Closer means more voice against the room.',
      'Only the level, the tone stays the same': 'A directional mic’s tone changes with distance: the proximity effect.',
    },
  },
  {
    id: 'b7.place.2',
    page: 'placement',
    prompt: 'Pops on P and B at the close start. A first idea to try?',
    options: ['A small offset off the breath line, or a screen', 'A high-pass filter added after the overload', 'Ask the reader to avoid the words with P and B'],
    correct: 'A small offset off the breath line, or a screen',
    explain: 'Move the air path first: a modest offset still aimed at the mouth, or a pop screen. A filter after the overload cannot repair a blast that already clipped.',
    why: {
      'A high-pass filter added after the overload': 'Once the capsule or preamp overloaded, a filter cannot undo it.',
      'Ask the reader to avoid the words with P and B': 'The script is the script. Move the mic or add a screen.',
    },
  },
  {
    id: 'b7.place.3',
    page: 'placement',
    prompt: 'A 90° turn of the mic off the breath line stopped the pops. What next, with another mic?',
    options: ['Test how that mic sounds off its axis', 'Turn it 90° too: the angle suits all mics', 'Nothing new: off axis is smoother on most mics'],
    correct: 'Test how that mic sounds off its axis',
    explain: 'Some mics stay smooth far off axis; others dull or colour the consonants. Test the offset on the real mic and voice.',
    why: {
      'Turn it 90° too: the angle suits all mics': 'Off-axis sound differs from mic to mic; a big angle can colour the voice.',
      'Nothing new: off axis is smoother on most mics': 'Off the axis, many mics lose clarity. Listen before deciding.',
    },
  },
  {
    id: 'b7.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The script stand is close in front of the mouth. A fair change?',
    options: ['Tilt it, or put the mic above the script', 'Move the script stand directly under the mic', 'Turn the mic to face the script stand'],
    correct: 'Tilt it, or put the mic above the script',
    explain: 'A tilted stand sends its copy of the voice away from the mic; above the script, the mic hears less of it and the reader keeps their view.',
    why: {
      'Move the script stand directly under the mic': 'Under the mic, the stand’s copy reaches it even more strongly.',
      'Turn the mic to face the script stand': 'Aimed at the stand, the mic hears the reflection more and the voice less.',
    },
  },
  {
    id: 'b7.ctx.1',
    page: 'context',
    prompt: 'A monitor loudspeaker sits on the desk near the host’s open mic. A fair first step?',
    options: ['Talent on headphones; the monitor off', 'Turn the monitor up so the host hears well', 'Point the mic straight at the monitor'],
    correct: 'Talent on headphones; the monitor off',
    explain: 'Keep loudspeakers out of an open mic’s path unless a designed echo-control system handles them. Headphones at a comfortable level; aim the pattern’s rejection only as a help.',
    why: {
      'Turn the monitor up so the host hears well': 'More monitor level means more of it in the mic — toward feedback.',
      'Point the mic straight at the monitor': 'The front of the mic is where it hears most.',
    },
  },
  superNull('b7.ctx.2', 'context', 'monitor'),
  {
    id: 'b7.ctx.studio',
    page: 'context',
    prompt: 'A narration in a quiet, treated booth, the reader on headphones. What is a fair first setup?',
    options: ['A close dynamic, or a condenser at 20–30 cm', 'A loudspeaker in the booth instead of phones', 'A mic across the booth for a natural sound'],
    correct: 'A close dynamic, or a condenser at 20–30 cm',
    explain: 'Headphones on, loudspeakers off. A close dynamic about 10 cm away for a dry read, or a screened condenser 20–30 cm away if the room is worth hearing.',
    why: {
      'A loudspeaker in the booth instead of phones': 'A loudspeaker near an open mic spills into it. Headphones.',
      'A mic across the booth for a natural sound': 'Far from the mouth, the booth’s ring and noise rise against the voice.',
    },
  },
  {
    id: 'b7.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A remote guest hears their own voice come back late. What does their return need?',
    options: ['The program without their own voice', 'More level so they can hear it clearly', 'A different headphone model for the guest'],
    correct: 'The program without their own voice',
    explain: 'Mix-minus: the return leaves out the guest’s own delayed voice.',
    why: {
      'More level so they can hear it clearly': 'Louder only makes the late echo easier to hear.',
      'A different headphone model for the guest': 'The headphones play what is sent; the return itself is wrong.',
    },
  },
  {
    id: 'b7.two.1',
    page: 'twoMic',
    prompt: 'With both desk mics open, the host sounds hollow. Why?',
    options: ['Their voice reaches the guest’s mic later', 'The guest’s mic reverses the host’s polarity', 'The host’s own mic is far too close to them'],
    correct: 'Their voice reaches the guest’s mic later',
    explain: 'The host reaches their own mic first and the guest’s mic later. Summed, some pitches cancel — a comb.',
    why: {
      'The guest’s mic reverses the host’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The host’s own mic is far too close to them': 'Close placement adds bass, not a comb. The comb comes from the second, later copy.',
    },
  },
  polarityDelay('b7.two.2'),
  {
    id: 'b7.two.3',
    page: 'twoMic',
    prompt: 'The guest is listening, not talking, for a long stretch. A fair step for their mic?',
    options: ['Mute it or lower it until they speak', 'Turn it up so it catches the room', 'Swap it for an omni for a fuller sound'],
    correct: 'Mute it or lower it until they speak',
    explain: 'An unused open mic adds the host later, the room and — live — less margin before feedback.',
    why: {
      'Turn it up so it catches the room': 'More gain on an unused mic adds bleed and room.',
      'Swap it for an omni for a fuller sound': 'An omni hears the host even more: more comb.',
    },
  },
  {
    id: 'b7.two.4',
    page: 'twoMic',
    prompt: 'Why give the host and the guest a channel each?',
    options: ['Each can be checked and balanced alone', 'Two channels make both of the voices louder', 'So the two mics become a stereo pair'],
    correct: 'Each can be checked and balanced alone',
    explain: 'Separate channels let each voice be soloed, matched, muted when silent and checked in mono with the other.',
    why: {
      'Two channels make both of the voices louder': 'Level comes from gain, not channels.',
      'So the two mics become a stereo pair': 'They are two close mics on two people, not a stereo pair.',
    },
  },
  {
    id: 'b7.prac.gain',
    page: 'practice',
    prompt: 'The reader’s emphatic line lights the overload light. What do you do?',
    options: ['Lower the input gain; check that line again', 'Fix it with a compressor on the channel later', 'Ask the reader to deliver the line more gently'],
    correct: 'Lower the input gain; check that line again',
    explain: 'Rehearse the loudest phrase and leave headroom for a more forceful take. A compressor cannot repair an overloaded capsule or a clipped input.',
    why: {
      'Fix it with a compressor on the channel later': 'A compressor after the clip cannot undo it.',
      'Ask the reader to deliver the line more gently': 'Set gain for the performance the reader really gives.',
    },
  },
  {
    id: 'b7.prac.3',
    page: 'practice',
    prompt: 'What would justify a second mic on one reader?',
    options: ['A need the first cannot meet, on its own channel', 'Two mics sound richer than one, so add a second', 'More mics give the voice more level in the program'],
    correct: 'A need the first cannot meet, on its own channel',
    explain: 'A deliberate perspective change, or a backup for a live read — each on its own channel, checked in mono. Two open mics on one voice comb.',
    why: {
      'Two mics sound richer than one, so add a second': 'Two mics on one voice usually sound hollower, not richer.',
      'More mics give the voice more level in the program': 'Level comes from gain and distance, not another mic.',
    },
  },
  {
    id: 'b7.mix.1',
    page: 'practice',
    prompt: 'The narration sounds hollow; a hard script stand sits right in front of the mic. A first idea to try?',
    options: ['Tilt the stand, or raise the mic above it', 'Boost the treble so the words come back', 'Move the reader a step farther back from the mic'],
    correct: 'Tilt the stand, or raise the mic above it',
    explain: 'The stand’s later copy cancels some pitches. Send it away from the mic, or put the mic above the script; EQ cannot fill the notches.',
    why: {
      'Boost the treble so the words come back': 'A comb is cancellation between two copies: EQ cannot undo it.',
      'Move the reader a step farther back from the mic': 'Farther, the reflection matters more against the direct voice.',
    },
  },
  {
    id: 'b7.mix.2',
    page: 'practice',
    prompt: 'A guest joins from home with only a laptop. What is a fair first improvement?',
    options: ['A wired earbud mic held steady, near the mouth', 'Raise their level until they match the host’s level', 'Strong noise reduction to remove the room'],
    correct: 'A wired earbud mic held steady, near the mouth',
    explain: 'A consistently placed earbud mic may beat a distant laptop mic — check speech and cable rub. A better room and placement come before software.',
    why: {
      'Raise their level until they match the host’s level': 'More gain on a distant mic raises the room and the fan too.',
      'Strong noise reduction to remove the room': 'Noise reduction cannot restore missing consonants or a reverberant voice.',
    },
  },
  removeDelayVoice('b7.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b7.sym.boom',
    observation: 'The read sounds boomy and thick',
    firstChecks: 'How close is the mic? Is it directional? Has the reader leaned in?',
    options: ['Ease back a little; compare at matched level', 'Turn the channel up so the words cut through', 'Add a second mic farther away to thin it out'],
    correct: 'Ease back a little; compare at matched level',
    explain: 'Close to a directional mic the proximity effect builds bass. Move back a little and compare at matched loudness before EQ.',
    why: {
      'Turn the channel up so the words cut through': 'More gain raises the boom with the words.',
      'Add a second mic farther away to thin it out': 'A second mic adds a comb and the room, not clarity.',
    },
  },
  {
    id: 'b7.sym.dull',
    observation: 'The voice dulls whenever the reader looks at the page',
    firstChecks: 'Is the script low? Does the head tip off the mic’s axis while reading?',
    options: ['Raise the script, or put the mic where they look', 'Boost the treble on the lines read off the page', 'Ask the reader to look straight at the mic'],
    correct: 'Raise the script, or put the mic where they look',
    explain: 'Reading down tips the voice off the axis. Bring the script up or the mic to where the reader looks — the mic above the script is one idea.',
    why: {
      'Boost the treble on the lines read off the page': 'EQ cannot put back what an off-axis mic missed, and it raises the hiss.',
      'Ask the reader to look straight at the mic': 'They need to read. Move the script or the mic.',
    },
  },
  {
    id: 'b7.sym.room',
    observation: 'The booth rings and the fan is audible',
    firstChecks: 'Is the mic moderate distance in a poor room? Can the fan be switched off? Soft panels?',
    options: ['Get closer; quiet the fan; soften reflections', 'Back the mic off for a more natural sound', 'Raise the gain so that the voice covers the fan'],
    correct: 'Get closer; quiet the fan; soften reflections',
    explain: 'Closer improves the voice against the room. Turn off the noise source and soften the strongest reflections — a blanket round the mic does not stop outside noise.',
    why: {
      'Back the mic off for a more natural sound': 'Farther away makes the room and the fan louder against the voice.',
      'Raise the gain so that the voice covers the fan': 'Gain raises the fan with the voice.',
    },
  },
  {
    id: 'b7.sym.echo',
    observation: 'The remote guest says they hear themselves late',
    firstChecks: 'Is their own voice in their return? Is a loudspeaker playing their voice near an open mic?',
    options: ['Send them a mix-minus return, on headphones', 'Turn their return up so the echo is clearer', 'Swap the host’s mic for one with a tighter pattern'],
    correct: 'Send them a mix-minus return, on headphones',
    explain: 'Their return should leave out their own voice, and nobody’s loudspeaker should feed an open mic.',
    why: {
      'Turn their return up so the echo is clearer': 'Louder only makes the echo worse.',
      'Swap the host’s mic for one with a tighter pattern': 'The echo is in the routing, not the host’s mic.',
    },
  },
  {
    id: 'b7.sym.pops',
    observation: 'Pops on P and B',
    firstChecks: 'Is the capsule in the breath line? Screen or windscreen in place?',
    options: ['Offset a little off the breath line; add a screen', 'Cut all of the low end on the reader’s channel', 'Ask the reader to speak more softly through the lines'],
    correct: 'Offset a little off the breath line; add a screen',
    explain: 'Keep the air off the capsule: a modest offset still aimed at the mouth, or a pop screen. Then check the consonants.',
    why: {
      'Cut all of the low end on the reader’s channel': 'A deep cut thins the voice and leaves the blast.',
      'Ask the reader to speak more softly through the lines': 'The delivery is the performance; move the mic.',
    },
  },
  hollowVoiceSymptom('b7.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b7.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a voice-over setup in the order you would do them.',
    steps: [
      { text: 'Choose the perspective: dry and close, or natural room', early: 'Decide what the read should sound like first.' },
      { text: 'Listen to the room; quiet the fan and the vents', early: 'Hear the room before choosing a distance.' },
      { text: 'Set the script so the reader can look up without moving off the mic', early: 'Arrange the script before placing the mic.' },
      { text: 'Place the mic at a starting distance with its screen', early: 'Place the mic once the script is set.' },
      { text: 'Set gain on the loudest phrase, with headroom', early: 'Gain comes once the mic is placed.' },
      { text: 'Check pops, a page turn and a head turn', early: 'Check the details once the level is set.' },
      { text: 'For a guest: their real input, headphones and the return', early: 'Add the guest after the reader is set.' },
    ],
    explain: 'A sensible order. Phantom power: mute the outputs first and follow your own equipment’s manual. Never test by blowing into a capsule or provoking feedback.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b7.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A dry, close announcer read in a small booth with a little fan noise, the reader standing at a script stand.',
    setups: [
      { id: 'a', label: 'A broadcast dynamic about 10 cm on axis, its windscreen on, the fan off', ok: true, power: 'none', feedback: 'A suggested start: close and dry — check pops and the script’s reflection.' },
      { id: 'b', label: 'A condenser above the script at eye level, aimed down at the mouth', ok: true, power: 'phantom', feedback: 'An idea that can pass — check the voice a little off its axis and the mount.' },
      { id: 'c', label: 'A condenser 60 cm away for a natural booth sound', ok: false, power: 'phantom', feedback: 'Far from the mouth: more booth and fan, not the dry read the brief asks for.' },
      { id: 'd', label: 'A mic aimed at the script stand to catch its sound', ok: false, power: 'none', feedback: 'Aimed at the stand, the mic hears its reflection, not the voice.' },
      { id: 'e', label: 'A loudspeaker in the booth so the reader can hear', ok: false, power: 'none', feedback: 'A loudspeaker spills into the open mic. Headphones.' },
    ],
    reasons: [docReason('the lips'), clearReason('the reader’s face and the line to the script'), { id: 'r.room', label: 'Close placement suits the dry perspective in this room', role: 'required', feedback: 'Say why the distance fits the brief and the room.' }, { id: 'r.panel', label: 'Soft panels make the booth soundproof', role: 'wrong', feedback: 'Panels soften some reflections; they do not stop outside noise.' }, BRAND_REASON('voice-over'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point measured from the lips, a perspective the room supports, clear of the face and the script.',
  },
  {
    id: 'b7.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A guest joins a live program from home, on a laptop, in a quiet room.',
    setups: [
      { id: 'a', label: 'An external mic near the mouth, chosen as the input, on headphones', ok: true, power: 'none', feedback: 'A suggested start: check the app chose it, and give them a return without their own voice.' },
      { id: 'b', label: 'A wired earbud mic held steady, on its own earbuds', ok: true, power: 'none', feedback: 'A fair fallback: check speech and cable rub.' },
      { id: 'c', label: 'The laptop’s own mic, the guest a metre back, on speakers', ok: false, power: 'none', feedback: 'A distant mic and loudspeakers: room, echo and spill.' },
      { id: 'd', label: 'Heavy noise reduction on the laptop mic', ok: false, power: 'none', feedback: 'Software cannot restore missing consonants. Placement first.' },
      { id: 'e', label: 'The guest’s return set to the whole program', ok: false, power: 'none', feedback: 'They would hear themselves late. Mix-minus.' },
    ],
    reasons: [{ id: 'r.input', label: 'The chosen mic is confirmed as the active input', role: 'required', feedback: 'Say how you checked the real input.' }, { id: 'r.return', label: 'The guest’s return leaves out their own voice', role: 'required', feedback: 'Say what the guest hears.' }, { id: 'r.phones', label: 'Headphones keep the program out of their mic', role: 'optional', feedback: 'A fair reason.' }, BRAND_REASON('remote guest'), { id: 'r.loud', label: 'Turn them up until they match the host', role: 'wrong', feedback: 'Gain on a distant mic raises the room too.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mic near the mouth, confirmed as the input, headphones, and a return without the guest’s own voice.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does a reader’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then look down to the script and try the stand.' },
  microphone: { prompt: 'Before you move anything: which mic keeps a turning guest at one distance?', options: ['A desk mic', 'A headset', 'A boundary mic'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: the condenser moves from 25 cm to 12 cm. What changes?', options: ['More bass and breath', 'More room', 'It depends on this voice'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The monitor is on the desk to the host’s left. Where will a supercardioid aimed at the host reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the guest mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A reader looks down at a low script. What happens at a mic in front of the mouth?',
    options: ['The voice moves off its axis and dulls', 'Nothing, as the distance stays about the same', 'The mic hears more of the voice’s highs'],
    correct: 'The voice moves off its axis and dulls',
    explain: 'The highs go ahead of the mouth; looking down points them at the page.',
    why: {
      'Nothing, as the distance stays about the same': 'The angle changes even when the distance barely does.',
      'The mic hears more of the voice’s highs': 'Off the axis, it hears fewer of them.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'What does a hard script stand near the mouth add at the mic?',
    options: ['A later copy that cancels some pitches', 'Extra low end from the stand’s metal', 'Nothing, because the paper on it is soft'],
    correct: 'A later copy that cancels some pitches',
    explain: 'A reflection off the stand reaches the mic later: a comb. Tilt it or put the mic above the script.',
    why: {
      'Extra low end from the stand’s metal': 'The main effect is the reflection’s later copy.',
      'Nothing, because the paper on it is soft': 'The stand behind the paper is hard and reflects.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'How do you test a reader’s mic and the system before a session?',
    options: ['With the real voice at a working level', 'By blowing into the capsule to hear it work', 'Raising the level until it rings, then back'],
    correct: 'With the real voice at a working level',
    explain: 'Never blow into a capsule and never provoke feedback: use the real voice at a working level.',
    why: {
      'By blowing into the capsule to hear it work': 'It can harm the capsule and tells you nothing about the voice.',
      'Raising the level until it rings, then back': 'Provoking feedback risks ears and loudspeakers.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'A remote guest with a good mic sounds distant. A first check?',
    options: ['Which mic the app is really using', 'Their camera’s angle on their face', 'The speed of their internet line'],
    correct: 'Which mic the app is really using',
    explain: 'The laptop’s own mic may be the active input. Confirm the input with the guest.',
    why: {
      'Their camera’s angle on their face': 'The camera angle does not change the sound input.',
      'The speed of their internet line': 'A slow line breaks the sound up or drops it; it does not make a voice distant and roomy.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'When does a moderate distance (20–30 cm) suit a narration?',
    options: ['When the room is worth hearing', 'When the booth is noisy and needs masking', 'When the reader moves around a lot'],
    correct: 'When the room is worth hearing',
    explain: 'Moderate distance brings in the room — a choice the room has to support.',
    why: {
      'When the booth is noisy and needs masking': 'Farther away, the noise rises against the voice.',
      'When the reader moves around a lot': 'Movement asks for a steady close place or a headset, not more distance.',
    },
  },
  hearingDiag('q.6', W),
];

const wedges: Wedge[] = [
  {
    id: 'monitor',
    label: 'the monitor loudspeaker on the desk, facing the host',
    short: 'MONITOR',
    p: { x: MONITOR_C.x, y: DESK_TOP_Y, z: MONITOR_C.z },
    lift: DESK_TOP_Y - MONITOR_C.y,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the desk to the host’s left, facing them: off while the mics are open — the exercise asks where it would sit against the pattern if it had to stay on.',
    prov: { kind: 'illustrative', reason: 'a small desk monitor: its place a drawing default' },
    glyph: 'none',
  },
];

export const B07_LESSON: Lesson = {
  id: 'B07',
  labId: 'broadcast',
  title: 'Voiceover, Narration and Broadcast Guests',
  subtitle: 'Close and dry or moderate with the room — the script, the guest’s real mic, and a return without their own voice',
  noun: { one: 'voice-over', many: 'voice-overs', subject: 'reader', person: true },
  model: B07_MODEL,
  micTypeIds: ['bcDynStand', 'vocLdc', 'vocLdcOpen', 'bcDynArm', 'bcDynSuper', 'vocHeadset'],
  zones: B07_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'One voice reading a script — a voice-over, a narration — or a guest joining a broadcast, in the studio or from somewhere else. The aim: intelligible, consistent speech with a chosen amount of intimacy and room.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Voice booths, narration rooms, studio desks with a guest, and guests at home on a laptop: a mic in front of the mouth, a script on a stand or a screen, headphones on.', src: 'LESSON' },
    { title: 'TWO PERSPECTIVES', text: 'Close and frontal: direct, intimate, dry. Moderate and frontal: more open, with some of the room. Each is an artistic choice that depends on the voice and the room.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT MIC', text: 'A broadcast dynamic, a studio condenser and a headset can each work for speech. Compare them at usable places and levels. Experimentation is encouraged.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — the power behind every word, whispered or projected.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips.' },
    ],
    attack: 'P and B push a puff of air straight out of the lips; S and T send a narrow hiss forward. A close mic in that path hears pops and harsh S sounds — a screen, a small offset or a mic above the script keeps them off the capsule.',
    body: 'The vowels carry the level and the tone. Close to a directional mic they gain bass (the proximity effect); farther away, the room joins in. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'reader', label: 'the reader', short: 'READER', note: 'Standing at the script stand, the mouth at the point every distance is read from. The head reads down and looks up.', prov: { kind: 'illustrative', reason: 'the shared figure (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'script', label: 'the script on its stand', short: 'SCRIPT', note: 'Close to the mouth, its hard face reflects the voice to the mic; page turns are a noise to check.', prov: { kind: 'illustrative', reason: 'the lesson L21–L22' }, tag: 'REFLECTION', scene: 'all' },
      { id: 'room', label: 'the booth, the fan and the vents', short: 'ROOM · NOISE', note: 'Farther from the mouth, the mic hears more of them. Soft panels tame some reflections; outside noise stays.', prov: { kind: 'illustrative', reason: 'the lesson L6' }, tag: 'ROOM', scene: 'all' },
      { id: 'guest', label: 'the studio guest', short: 'GUEST', note: 'Across the desk on their own mic: their voice reaches the host’s mic later and lower.', prov: { kind: 'illustrative', reason: 'the lesson L34' }, tag: 'BLEED', scene: 'stage' },
      { id: 'monitor', label: 'the monitor loudspeaker', short: 'MONITOR', note: 'Off while the mics are open; the talent hears on headphones.', prov: { kind: 'illustrative', reason: 'the lesson L39' }, tag: 'SPILL', scene: 'stage' },
      { id: 'remote', label: 'a remote guest', short: 'REMOTE', note: 'Their own mic near the mouth, chosen as the input, headphones on, a return without their own voice.', prov: { kind: 'illustrative', reason: 'the lesson L35–L38' }, tag: 'RETURN', scene: 'all' },
    ],
    stage: 'GUEST DESK: a mic each, close and on its own channel, the monitor off, headphones on, the remote guest’s return without their own voice.',
    studio: 'BOOTH: close and dry about 10 cm away, or a screened condenser 20–30 cm away if the room is worth hearing — headphones on, the loudspeakers off.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a dry announcer read and for a guest joining from home, describe an alternative, and explain what would justify a second mic. With a real reader and their agreement, you can record what you tried below.',
    fields: [
      { id: 'brief', label: 'Destination and perspective (dry or natural room)', kind: 'text' },
      { id: 'mic', label: 'Mic and pattern', kind: 'choice', choices: ['broadcast dynamic', 'studio condenser with a screen', 'condenser above the script', 'headset', 'other'] },
      { id: 'distance', label: 'Distance from the lips, and the angle off the mouth’s axis', kind: 'text' },
      { id: 'script', label: 'Script arrangement and pop protection', kind: 'text' },
      { id: 'guest', label: 'Guest input, headphones and return', kind: 'text' },
      { id: 'notes', label: 'What you heard and one remaining limitation (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The reader standing (the lips 1550 mm above the floor) and the host and guest seated (the lips 450 mm above a 740 mm desk) — the shared figures’ drawing defaults.', dims: ['yFloor'] },
    { text: 'The script stand: 38 cm in front of the lips, 30 cm below them, tilted back 35°, 30 × 50 cm — a drawing default; the booth wall and its panels too.', dims: [] },
    { text: 'The guest desk (about 1.4 m deep), the guest’s place, the arms and the monitor loudspeaker — drawing defaults. The broadcast dynamic’s size is a drawing default.', dims: [] },
    { text: '“A very slight angle” off the breath: 10–20° above the axis; “about eye level”: 10–25° above — the lab’s drawing. The head turns about its centre (a simplified picture).', dims: [] },
    { text: 'The script stand’s reflection is drawn as a hard, flat mirror and the mouth as one point (a simplified picture).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every voice, script and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a reader in a typical standing pose, a host and a guest seated, the script stand’s reflection as a mirror, mic patterns and the two-mic comb as textbook shapes. Distances are rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m and measured from the lips to the mic’s front. Never test a mic by blowing into it or by provoking feedback.',
  copy: B07_COPY,
};

export const B07_FLOOR_DESK = SEATED_FLOOR;
