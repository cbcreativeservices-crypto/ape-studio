/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: the seated host at a desk, the studio
 * and the live show, the worked starting points, the two hosts, the PA.
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from radio_host/SOURCES.md or a named drawing
 * default (CORRECTIONS_LOG "L7G1").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

const INTRO = 'This lesson is about putting a microphone on a host who speaks — on the radio, on a podcast, in a studio, and on a live talk show. First the host and the desk: where the voice leaves, what a head turn and the desk do, and what a second host’s mic hears; then real starting setups drawn on the host, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a host at a desk',
  startIntro: INTRO,
  contextIntro: 'These are scenario-based comparisons, not restrictions: the host is the same — the room, the guests and the loudspeakers change.',
  worked: { studio: 'b1.dyn', live: 'b1.close' },
  liveZone: 'b1.close',
  pairA: 'b1.dyn',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b1.prac.gain', second: 'b1.prac.3', mixed: ['b1.mix.1', 'b1.mix.2', 'b1.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the desk’s reflection, the open mics, and polarity versus delay.' },
  before: [
    { title: 'LISTEN TO THE HOST AND THE ROOM FIRST', text: 'Before any mic: hear normal speech, emphatic speech, a laugh, a breath and a head turn at the real desk. Find the fans, the air conditioning, the traffic, bare walls, the desk’s reflection and chair or arm noise — and reduce them at the source where you can. A mic cannot remove sound that already reaches it.' },
    { title: 'WHICH END TO SPEAK INTO', text: 'Check the address side on the mic itself: an end-address mic is spoken into along its body, a side-address mic into its marked front. Do not judge it by its shape.' },
    { title: 'A SAFE, STEADY ARM', text: 'Secure the arm and its clamp within their load rating; mind the springs and the pinch points; route the cable with slack through the arm’s travel; keep stands and cables out of walking paths. Phantom power only on paths made for it.' },
    { title: 'LIVE: NEVER PROVOKE FEEDBACK', text: 'Before a live show, trace every mic to the recorder, the stream, the headphones, the talkback and the PA. Bring each mic up only to its working level with the responsible operator; at any ring, pull that channel down at once and fix the geometry — never raise a level to find feedback.' },
  ],
  studio: {
    id: 'b1.ctx.studio',
    prompt: 'Two hosts in a quiet studio, on headphones, a desk between them. What is the first thing to set up?',
    note: 'In the studio there is no PA to reject: headphones and the loudspeakers off keep the program out of the mics. A mic each, close and on its own channel, is a place to begin. Switch to LIVE SHOW for the PA exercise.',
  },
  contextPoints: [
    { title: 'PERSPECTIVE', text: 'Studio: a mic each, about 10–15 cm for a broadcast dynamic or 15–20 cm for a condenser, on separate channels. Live: closer, so the voice stays ahead of the PA and the room.' },
    { title: 'SPILL AND FEEDBACK', text: 'Studio bleed and PA feedback are related routing problems, not the same thing. Live, every open mic hears the PA: fewest open mics, and the pattern’s rejection toward the loudspeaker.' },
    { title: 'MOVEMENT', text: 'Hosts read down, turn to a guest and lean back. A steady seated position matters more than the exact number — move the arm to the host, do not make the host crane to the mic.' },
    { title: 'THE LOUDEST LINE', text: 'Set gain on the loudest real speech, the laugh and the shout, with headroom at every stage. No single peak number is a placement rule.' },
  ],
});

export const B01_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { studio: 'studio', twoHosts: 'two hosts', live: 'live show' },
  sceneSubject: { studio: 'a host at a desk in a studio', twoHosts: 'two hosts at a desk in a studio', live: 'a host at a desk on a stage, the PA in front' },
  viewTag: { side: 'SIDE · FROM THE HOST’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'out from the host', minus: 'toward the host', label: 'IN–OUT', blurb: 'Out from the host over the desk, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin, the chest and the desk top (45 cm down).' },
    z: { plus: 'to host’s right', minus: 'to host’s left', label: 'ACROSS', blurb: 'Toward the host’s right or left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A host seated at a desk · every part named',
    figureLabel: 'A host seated at a desk, seen from the right, a laptop on the desk and a clamp for a mic arm on its edge.',
    partsBadge: 'A host at a desk · tap a part to name it',
    partsLooking: { side: 'Side view · from the host’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. Around the host: the desk, the arm’s clamp, the laptop, the script, the second host. Tap any of them.',
    variantNotes: {
      studio: 'STUDIO: the host at a desk on closed-back headphones, a mic on a desk arm, the loudspeakers off. Switch WHERE to see two hosts or a live show.',
      twoHosts: 'TWO HOSTS: two hosts across a 1.4 m desk, each on closed-back headphones, each on their own mic.',
      live: 'LIVE SHOW: the host alone at the desk on a stage; the PA faces the audience, but its back and side spill toward the desk.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A host at a desk, from above.',
    kitLanding: 'Tap anything around the host. There is nothing to answer yet.',
    kitIdle: 'Everything around the host is either their space, the desk, or something a mic can hear.',
    stageA11y: 'A host at a desk on a stage, from above.',
    studioA11y: 'Two hosts at a desk in a studio, from above.',
    stageIdle: 'The PA faces the audience; its back and side reach the desk.',
    studioIdle: 'Headphones on, the loudspeakers off: the other host is the main thing a mic hears besides its own.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { studio: 'b1.dyn', twoHosts: 'b1.dyn', live: 'b1.close' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips. The host speaks into its end.',
    workedClear: 'Clear of the host: the mic, its windscreen and the arm keep off the face, out of the line to the laptop’s screen, and away from the hands on the desk. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more bass, breath and pops and less of the room; farther, more room and more of the other host; a little above the mouth’s line, softer pops. Hosts and rooms vary, so “it depends on this host” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      bcDynArm: 'Ideas to try with the broadcast dynamic: speak into its END; start about 10–15 cm away, then move a little closer and farther with the host sitting naturally, comparing at matched loudness.',
      bcDynSuper: 'Ideas to try with a supercardioid: its rear lobe means a loudspeaker behind it goes well to one side of its rear — check the actual pattern.',
      bcLdcArm: 'Ideas to try with the studio condenser: front mark toward the mouth, a pop screen at least 10 cm in front of it, about 15–20 cm from the lips; listen for the room and the desk.',
    },
    note: 'Clearance comes first: nothing touches the host, the arm stays out of the sight line and the page turns, and the clamp holds within its rating.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on a host, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, desk and room is different.',
      separate: 'Distance, height and the angle off the mouth’s axis are separate variables: change one at a time, with the host reading the real script each time. Distances are measured to the mic’s FRONT and rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m — no millimetre claim is made.',
      clearance: 'Clearance comes first: off the face, out of the sight line, clear of the hands and the papers.',
      tendencies: 'Closer tends to sound fuller and drier, with more breath and pops from a directional mic (the proximity effect); farther, more room and more of the other host; off the mouth’s line, softer pops. These are tendencies, and voices vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'live',
    zone: 'b1.close',
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
    plan: { u0: -600, u1: 3000, v0: -1500, v1: 700 },
    side: { u0: -600, u1: 3000, v0: -1000, v1: 1260 },
    target: 'pa',
    targetWord: 'PA',
    badgeWhere: 'the PA where a stage often puts it',
    looking: 'The host live at the desk · the PA at the stage’s front corner',
    prompt: 'The PA stays where the show needs it. Turn or tilt the MIC (AIM), or change its PATTERN, until the PA sits in the rejection — while the mic still points at the mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Aimed back at the host’s mouth, its rear points out toward the stage’s front — near where the PA is. Turning and tilting decide how close the PA comes to that rejection; the pattern decides where it is.',
    shieldNote: 'The desk, the host and the room reflect the PA’s sound too, and the free-field pattern cannot show that. Listen with the PA on, at the agreed level.',
    learn: {
      ...BASE.context!.learn,
      body: 'On a live show the PA is a loudspeaker every open mic hears. A pattern’s rejection is a tool to aim; a closer mic and fewer open mics do more.',
      warn: 'No mic position alone prevents feedback: the pattern, the open mics, the PA’s place and level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'twoHosts',
    label: 'Two hosts, a mic each',
    A: { typeId: 'bcDynArm', pattern: 'cardioid', zone: 'b1.dyn' },
    B: { typeId: 'bcDynArm', pattern: 'cardioid', zone: 'b1.hostB' },
    learn: [
      'Each host has their own mic, but each mic also hears the other host — later and lower. In the mix, one voice arrives twice: through its own mic first, through the other a little later.',
      'Listen to each channel alone, then the mix in MONO with both open. A hollow, thin sound means some pitches cancel: move a mic closer to its own host, turn its rear to the other, or mute the mic no one is using. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats each mouth as one point and both mics as hearing the same sound. Real mics hear different mixes of voice and room, and hosts move — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the host',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the host and the desk first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: the windscreen of a broadcast dynamic, the face of a condenser.',
    clipMount: 'Mount: a spring arm clamped to the desk edge, within its load rating, the cable with slack through its travel',
    standMount: 'Mount: a desk arm or a stand clear of the host’s hands and the papers',
    observation: 'For a real host, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
