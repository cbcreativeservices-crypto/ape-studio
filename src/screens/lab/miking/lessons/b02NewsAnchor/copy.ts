/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: an anchor and a guest seated at a
 * desk on camera, lavs, a fixed boom, desk mics, a public interview's PA.
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from news_anchor/SOURCES.md, DERIVED from the
 * drawn frame, or a named drawing default (CORRECTIONS_LOG "L7G2").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SAFETY } from '../shared/broadcast/bodyWorn.ts';

const INTRO = 'This lesson is about miking a seated anchor and a guest on camera — a lav on the chest, a hidden lav, a boom just outside the shot, a mic on the desk — and keeping each voice clear through turns, papers and a live program. First the anchor and the desk: where the voice leaves, what a head turn does to each mic, where the frame lets a boom go, the desk’s bounce and every open mic; then real starting setups drawn on the anchor, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a seated anchor or guest',
  startIntro: INTRO,
  worked: { studio: 'b2.lav', live: 'b2.lav' },
  liveZone: 'b2.goose',
  pairA: 'b2.boom',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b2.prac.gain', second: 'b2.prac.3', mixed: ['b2.mix.1', 'b2.mix.2', 'b2.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the frame, the desk, and polarity versus delay.' },
  before: [
    { title: 'THE SHOT, THE MOVES, THE ROOM', text: 'Before any mic: ask for the widest frame, the camera moves, the light and the likely turns — to the camera, to the guest, down to the script. Listen at the seat for fans, a hard desk and the room; note who handles paper or a tablet.' },
    { title: 'ASK FIRST — CONSENT AND WARDROBE', text: `${SAFETY.consent} ${SAFETY.wardrobe} ${SAFETY.skin}` },
    { title: 'RIGGING AND POWER', text: `A fixed boom over a seated person is rigged and secured by qualified crew before anyone sits beneath it. ${SAFETY.phantom}` },
    { title: 'LIVE: NEVER PROVOKE FEEDBACK', text: 'In a public interview with a PA, bring each mic up only to its working level with the responsible operator; at any ring, pull it down at once and fix the geometry — never raise a level to find feedback.' },
  ],
  studio: {
    id: 'b2.ctx.studio',
    prompt: 'A recorded news interview in a quiet studio, no loudspeakers, a two-shot. What is a fair first setup?',
    note: 'With no PA, a lav each — centred, on separate labelled channels — is a place to begin; a boom just outside the frame can carry the program with the lavs as fallbacks. Switch to PUBLIC for the PA exercise.',
  },
  contextPoints: [
    { title: 'NEWS SET', text: 'A normal news set may not put the anchor in any local loudspeaker: the lavs, a boom outside the frame or a desk mic can all work, each for a reason.' },
    { title: 'PUBLIC INTERVIEW', text: 'With an audience and a PA, every open mic hears the loudspeakers: closer mics, the fewest open, and a pattern’s rejection toward the PA where the mic has one.' },
    { title: 'A CHANNEL EACH', text: 'Separate, labelled channels for the anchor and the guest; mute the unused one as the format permits.' },
    { title: 'THE FALLBACK', text: 'A tested second mic, checked on its own, with a clear cue for switching — never two unverified mics summed.' },
  ],
});

export const B02_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'SHOT',
  variantShort: { close: 'close shot', twoShot: 'two-shot', public: 'public interview' },
  sceneSubject: { close: 'an anchor at a desk, close on camera', twoShot: 'an anchor and a guest at a desk, a two-shot', public: 'an anchor and a guest at a desk, an audience and a PA' },
  viewTag: { side: 'SIDE · FROM THE ANCHOR’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the camera', minus: 'toward the anchor', label: 'IN–OUT', blurb: 'Out from the anchor over the desk toward the camera, or back (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chest, then the desk top (45 cm down); above them the frame’s top edge.' },
    z: { plus: 'toward the guest', minus: 'away from the guest', label: 'ACROSS', blurb: 'Toward the anchor’s right, where the guest sits, or their left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'An anchor at a desk · every part named',
    figureLabel: 'An anchor seated at a desk in a jacket, seen from the right, a camera in front.',
    partsBadge: 'An anchor and a guest · tap a part to name it',
    partsLooking: { side: 'Side view · from the anchor’s right', top: 'Top view · from above' },
    partsIdle: 'Each voice leaves through its mouth — every distance is read from the lips. Around the anchor: the desk, a gooseneck’s base, the guest, the camera and, in public, the PA. Tap any of them.',
    variantNotes: {
      close: 'CLOSE: the camera close on the anchor, head and shoulders; the guest beside them, out of the picture. Switch SHOT to see the two-shot or a public interview.',
      twoShot: 'TWO-SHOT: the same camera wider, both in the picture — the frame’s top higher.',
      public: 'PUBLIC: the two-shot, an audience in front; the PA at the stage’s front corner faces them, but every open mic on the set hears it.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'An anchor and a guest at a desk, from above.',
    kitLanding: 'Tap anything at the desk. There is nothing to answer yet.',
    kitIdle: 'Everything is either a talker, the desk and what is on it, the picture, or something a mic can hear.',
    stageA11y: 'An anchor and a guest at a desk with an audience, from above.',
    studioA11y: 'An anchor and a guest at a desk in a studio, from above.',
    stageIdle: 'The PA faces the audience; its back and side reach the desk.',
    studioIdle: 'No loudspeakers: the desk, the papers, the room and the other talker are what a mic hears besides its own voice.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { close: 'b2.lav', twoShot: 'b2.lav', public: 'b2.lav' },
    workedAim: 'An omni lav’s aim matters little — point it up toward the mouth; the lab counts it while it points within about {tol}° of the lips. A boom or a desk mic is aimed at the mouth.',
    workedClear: 'Clear of the anchor’s movement and the picture: the lav on a firm edge, off the jacket, the hair and the jewellery, its cable looped; a boom outside every frame; a desk mic’s base away from the papers. Clearance comes first, before any number.',
    reveal: 'A chest lav keeps one distance but hears the clothes and drifts off the turning mouth; a boom from above sounds open but must stay outside the frame; a raised desk mic hears the desk’s bounce; a boundary on the desk hears more room. Desks and voices vary, so “it depends on this set” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      locLav: 'Ideas to try with a lav: centred on a firm edge first, then — only if the shot needs it — hidden under one layer, compared at matched loudness.',
      shotgunShort: 'Ideas to try with the fixed boom’s short shotgun: its tube’s tip just outside the widest frame, aimed at the mouth; distances read to its capsule.',
      compactHyper: 'Ideas to try with a compact hypercardioid on the boom: the same place, matched loudness — often smoother among a studio’s reflections.',
      bcGoose: 'Ideas to try with a gooseneck: its capsule raised toward the mouth, a little below its line; the base away from the papers.',
      bcGooseSuper: 'Ideas to try with a supercardioid gooseneck: its rejection toward the rear, a little to one side — check where the PA sits.',
      bcBoundaryDesk: 'Ideas to try with a boundary on the desk: its front toward the anchor, its opening clear, nothing on it — and check its actual pattern.',
    },
    note: 'Ask first: a lav goes on a person only with their agreement and wardrobe’s; nothing on skin except an adhesive made for skin. A fixed boom over a seated person is rigged by qualified crew.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic on a seated anchor or guest, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every shot, desk and voice is different.',
      separate: 'Where the mic is — chest, above, the desk — its distance and its angle off the mouth are separate variables: change one at a time, with the anchor reading, turning and handling papers as they really will. Distances are measured to the mic’s front (a short shotgun’s capsule) and rounded to about 5 mm.',
      clearance: 'Clearance comes first: off the clothes and the face, outside every frame, the base away from the papers and the hands.',
      tendencies: 'A chest lav: steady distance, a little chest-heavy, the clothes. A boom above: open, more room, out of the picture. A raised desk mic: closer, but the desk’s bounce. A boundary: low, more room and papers. Tendencies, and sets vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'public',
    zone: 'b2.goose',
    typeId: 'bcGoose',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'bcGoose' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcGooseSuper' },
    ],
    micNoun: 'A gooseneck',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the gooseneck’s capsule up to 60° either way — it still faces the mouth.',
    plan: { u0: -700, u1: 3000, v0: -2000, v1: 1700 },
    side: { u0: -700, u1: 3000, v0: -1100, v1: 1260 },
    target: 'pa',
    targetWord: 'PA',
    looking: 'A public interview at the desk · the PA at the stage’s front corner, on the anchor’s left',
    prompt: 'The PA stays where the show needs it. Turn or tilt the gooseneck’s capsule (AIM), or change its PATTERN, until the PA sits in the rejection — while it still points at the mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a gooseneck below the mouth, aimed up at it, points its rear down and forward over the desk — the PA, high at the stage’s corner, sits off to the side of that. A supercardioid’s rejection lies round toward the side of its rear; the aim decides how close the PA comes.',
    shieldNote: 'The desk, the talkers and the room reflect the PA’s sound too, and the free-field pattern cannot show that. Check it with the system’s operator at a safe level.',
    learn: {
      ...BASE.context!.learn,
      body: 'In a public interview the PA is a loudspeaker every open mic hears. Close mics, the fewest open, and a pattern’s rejection aimed at the PA do more than any single trick.',
      warn: 'No mic position alone prevents feedback: the pattern, the open mics, the PA’s place and level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'close',
    label: 'The fixed boom and the anchor’s lav',
    A: { typeId: 'shotgunShort', pattern: 'supercardioid', zone: 'b2.boom' },
    B: { typeId: 'locLav', pattern: 'omni', zone: 'b2.lav' },
    learn: [
      'A boom for the program and a lav as a safety track both hear the anchor — the lav first, close on the chest, the boom a little later from above. Summed, the voice combs.',
      'Listen to each alone, then any sum in MONO. Use the intended channel; keep the other on its own track with a clear cue for switching. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. A boom and a lav hear very different mixes of voice, chest and room — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the anchor',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the anchor, the frame and the desk first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: the capsule of a lav, the capsule behind a short shotgun’s tube, the front of a desk mic.',
    clipMount: 'Mount: a clip on a firm clothing edge (a lav), or a gooseneck from its base on the desk',
    standMount: 'Mount: a fixed boom stand, its arm level from the side, rigged and secured by qualified crew',
    observation: 'For a real anchor and guest, with their agreement and wardrobe’s. Write tendencies in words — what you heard, not a promised result.',
  },
};
