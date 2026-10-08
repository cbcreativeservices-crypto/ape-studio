/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: the booth and the guest desk, the
 * close and moderate perspectives, the script stand, the in-studio and
 * remote guests. Starting-points voice (owner ruling 2026-10-04): no
 * sources, brands or badges. Every number is from voiceover_guests/
 * SOURCES.md or a named drawing default (CORRECTIONS_LOG "L7G1").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

const INTRO = 'This lesson is about putting a microphone on one voice reading a script — a voice-over, a narration — and on a broadcast guest, in the studio or joining from somewhere else. First the reader: where the voice leaves, what reading down does, and how the script stand answers back; then real starting setups drawn on the reader, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a reader or a guest',
  startIntro: INTRO,
  contextIntro: 'These are scenario-based comparisons, not restrictions: the reader is the same — the room, the desk and the loudspeakers change.',
  worked: { studio: 'b7.close', live: 'b7.host' },
  liveZone: 'b7.host',
  pairA: 'b7.host',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b7.prac.gain', second: 'b7.prac.3', mixed: ['b7.mix.1', 'b7.mix.2', 'b7.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the script stand, a guest’s return, and polarity versus delay.' },
  before: [
    { title: 'CHOOSE THE PERSPECTIVE FIRST', text: 'Before any mic: a dry, close announcer sound, a natural narration with some room, or a guest who must match the host? Ask whether the reader sits or stands, reads from paper or a screen, turns to someone, whispers or projects, and has to stay on camera.' },
    { title: 'LISTEN TO THE ROOM', text: 'Scout the real position: fans, vents, traffic, furniture and the booth’s own ring. Listen to speech and to the pauses. Soft panels tame some reflections; a blanket round a mic does not make outside noise disappear.' },
    { title: 'A REMOTE GUEST’S MIC', text: 'Agree a quiet room and an external mic or a headset before the event, with headphones or earbuds so the program does not spill from loudspeakers into the mic — and check the app really chose that mic, not the laptop’s own. Test with the guest’s normal posture, level and connection.' },
    { title: 'NEVER PROVOKE FEEDBACK', text: 'Keep loudspeakers out of an open mic’s path; headphones at a comfortable level. Never test by provoking feedback or by blowing into a capsule — use the real voice. Secure heavy arms and stands; keep cables out of walking paths.' },
  ],
  studio: {
    id: 'b7.ctx.studio',
    prompt: 'A narration in a quiet, treated booth, the reader on headphones. What is a fair first setup?',
    note: 'In the booth there is nothing to reject: headphones on, the loudspeakers off. A close dynamic about 10 cm away, or a screened condenser 20–30 cm away if the room is worth hearing, is a place to begin. Switch to GUEST DESK for the monitor exercise.',
  },
  contextPoints: [
    { title: 'PERSPECTIVE', text: 'Close (about 10 cm): direct, intimate, dry — more breath and bass. Moderate (20–30 cm): more open, with the room in it — only if the room is worth hearing.' },
    { title: 'SPILL', text: 'A loudspeaker near an open mic sends the program back in. Headphones for the talent; the monitor off, or its sound in the pattern’s rejection, while the mics are open.' },
    { title: 'MOVEMENT', text: 'Readers look down and up; guests turn to the host. Move the script, not the neck; give a guest who turns a headset, or a mic placed where they look.' },
    { title: 'MATCHING VOICES', text: 'A guest is matched to the host by placement, distance and level at the program destination — more than by the mic’s printed name.' },
  ],
});

export const B07_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { booth: 'booth', desk: 'live desk', guest: 'guest desk' },
  sceneSubject: { booth: 'a reader standing at a script stand in a voice booth', desk: 'a host alone at a studio desk', guest: 'a host and a guest at a studio desk' },
  viewTag: { side: 'SIDE · FROM THE READER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'out from the reader', minus: 'toward the reader', label: 'IN–OUT', blurb: 'Out from the reader toward the script, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: above them the eyes, below them the chin, the chest and the script.' },
    z: { plus: 'to reader’s right', minus: 'to reader’s left', label: 'ACROSS', blurb: 'Toward the reader’s right or left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A reader at a script stand in a booth · every part named',
    figureLabel: 'A reader standing in a voice booth, seen from the right, a script on a music stand in front.',
    partsBadge: 'A reader or a guest · tap a part to name it',
    partsLooking: { side: 'Side view · from the reader’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. Around the reader: the script stand, the headphones, the soft panels; at the desk, the guest and the monitor. Tap any of them.',
    variantNotes: {
      booth: 'BOOTH: the reader standing at a script stand, on closed-back headphones; soft panels behind. Switch WHERE to see the guest desk.',
      desk: 'LIVE DESK: the host alone for a live read, a mic on an arm; the monitor loudspeaker is off while the mic is open.',
      guest: 'GUEST DESK: the host and an in-studio guest, a mic each on an arm; the monitor loudspeaker is off while the mics are open.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A reader in a booth, from above.',
    kitLanding: 'Tap anything around the reader. There is nothing to answer yet.',
    kitIdle: 'Everything around the reader is their space, the script, or something a mic can hear.',
    stageA11y: 'A host and a guest at a desk, from above.',
    studioA11y: 'A reader in a voice booth, from above.',
    stageIdle: 'A monitor loudspeaker on the desk: off while the mics are open.',
    studioIdle: 'Headphones on, the loudspeakers off: the booth and the script are what the mic hears besides the voice.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { booth: 'b7.close', desk: 'b7.host', guest: 'b7.host' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips. The reader speaks into its end.',
    workedClear: 'Clear of the reader: the mic, its windscreen and its stand keep off the face and out of the line to the script, and the stand’s base clear of the feet. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more intimacy, breath, pops and bass; farther, more of the room and an easier, more open voice; above the script, fewer pops and less of the paper. Readers and rooms vary, so “it depends on this voice and this room” is fair too.',
    typeNotes: {
      bcDynStand: 'Ideas to try with the broadcast dynamic: speak into its END, about 10 cm away with its windscreen on; then a little off the breath line, comparing the consonants.',
      vocLdc: 'Ideas to try with the screened condenser: 20–30 cm away only if the room is worth hearing; keep the screen at least 10 cm in front of the mic.',
      vocLdcOpen: 'Ideas to try above the script: mount it firmly at about eye level, aimed down at the mouth, so the reader looks under it to the page.',
      bcDynArm: 'Ideas to try at the desk: the host and the guest at similar distances, each on their own channel, compared at the program destination.',
      vocHeadset: 'Ideas to try with a guest’s headset: the capsule where its maker says, near the corner of the mouth; check comfort and how it looks.',
    },
    note: 'Clearance comes first: nothing touches the reader, the line to the script stays open, the mount holds within its rating, and cables stay out of walking paths.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on a reader or a guest, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, script and room is different.',
      separate: 'Distance, height and the angle off the mouth’s axis are separate variables: change one at a time, with the reader reading the same passage each time. Distances are measured to the mic’s FRONT and rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m.',
      clearance: 'Clearance comes first: off the face, out of the line to the script, clear of the hands and the page turns.',
      tendencies: 'Closer tends to sound more intimate, with more breath, pops and bass from a directional mic (the proximity effect); farther, more room and a steadier level; off the mouth’s line or above the script, softer pops. These are tendencies, and voices vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'desk',
    zone: 'b7.host',
    typeId: 'bcDynArm',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'bcDynArm' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcDynSuper' },
    ],
    micNoun: 'A broadcast dynamic',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the mouth.',
    plan: { u0: -500, u1: 1300, v0: -800, v1: 500 },
    side: { u0: -500, u1: 1300, v0: -600, v1: 1260 },
    target: 'monitor',
    targetWord: 'monitor',
    badgeWhere: 'the monitor loudspeaker where a desk often puts it',
    looking: 'The host at the desk · the monitor loudspeaker on the desk',
    prompt: 'If the monitor had to stay on, where would its sound be rejected most? Turn or tilt the MIC (AIM), or change its PATTERN, until the monitor sits in the rejection — while the mic still points at the mouth.',
    activityDone: 'done — the monitor sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most straight behind (180°). The monitor is off to the side on the desk, so turning the mic helps only so far — which is why the talent hears the program on headphones and the monitor stays off while the mics are open.',
    shieldNote: 'The desk and the people reflect the monitor’s sound too, and the free-field pattern cannot show that. A designed echo-control system is the only reason to leave a loudspeaker on near an open mic.',
    learn: {
      ...BASE.context!.learn,
      body: 'A pattern’s rejection is a tool to aim; a loudspeaker switched off, and headphones, do more. Mute or lower the mics nobody is using.',
      warn: 'Never create feedback deliberately — not as an exercise, not to “find” a frequency — and never blow into a capsule to test it.',
    },
  },
  twoMic: {
    variant: 'guest',
    label: 'Host and guest, a mic each',
    A: { typeId: 'bcDynArm', pattern: 'cardioid', zone: 'b7.host' },
    B: { typeId: 'bcDynArm', pattern: 'cardioid', zone: 'b7.guest' },
    learn: [
      'The host and the guest each have their own mic, and each mic also hears the other voice — later and lower. With both open, one voice arrives twice in the program.',
      'Listen to each channel alone, then the program in MONO. A hollow sound means some pitches cancel: bring each mic close to its own talker, turn its rear to the other, and mute the one not in use. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats each mouth as one point and both mics as hearing the same sound. Read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the reader',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the reader and the script first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic.',
    clipMount: 'Mount: a spring arm clamped to the desk (a headset for a guest who turns)',
    standMount: 'Mount: a firm boom stand, its base clear of the reader’s feet and the script stand',
    observation: 'For a real reader, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
