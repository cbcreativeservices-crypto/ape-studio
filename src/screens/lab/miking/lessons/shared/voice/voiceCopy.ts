/**
 * THE VOICE FAMILY'S PAGE WORDS (engine/model/copy.ts) for a STANDING SINGER
 * in frame V — shared by E01 (lead vocal) and E03 (rap), and by every later
 * standing singer: the lesson hands in what is its own (the worked starting
 * points, the studio card, the "before any mic" points, the opening), the
 * rest is the family's. Starting-points voice (owner ruling 2026-10-04): no
 * sources, brands or badges. Pure data.
 */
import type { LessonCopy } from '../../../engine/model/copy.ts';
import type { MicPose } from '../../../engine/model/types.ts';

/** A second mic at a MATCHED distance, `deg` to the singer's right, aimed at
 *  the mouth (frame V) — the lessons' "compare two mics at matched distance
 *  and level" (E01 L85, E03 L79). */
export function matchedPair(dist: number, deg: number): MicPose {
  const a = (deg * Math.PI) / 180;
  return { p: { x: dist * Math.cos(a), y: 0, z: dist * Math.sin(a) }, az: -deg, el: 0 };
}

export type StandingVoiceCopyOpts = {
  /** "a lead vocal" — what the lesson mics. */
  what: string;
  startIntro: string;
  /** The worked example per variant ('studio', 'live'). */
  worked: { studio: string; live: string };
  /** The stage starting point the Studio-or-live page begins from. */
  liveZone: string;
  /** The two-mic page's pair: mic A's zone (studio) and mic B's pose. */
  pairA: string;
  pairB: MicPose;
  practice: LessonCopy['practice'];
  before: LessonCopy['setting']['before'];
  studio: { id: string; prompt: string; note: string };
  variantNotes?: LessonCopy['instrument']['variantNotes'];
  /** A lesson's own lines in the Studio-or-live LEARN card (else the family's). */
  contextPoints?: LessonCopy['context']['learn']['points'];
};

export function standingVoiceCopy(o: StandingVoiceCopyOpts): Partial<LessonCopy> {
  return {
    variantKey: 'WHERE',
    variantShort: { studio: 'studio', live: 'stage' },
    sceneSubject: { studio: 'a singer standing in a studio, on headphones', live: 'a singer standing on a stage' },
    viewTag: { side: 'SIDE · FROM THE SINGER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { plus: 'out from the singer', minus: 'toward the singer', label: 'IN–OUT', blurb: 'Out from the singer along the mouth’s axis, or back toward them (x). Distances are read from the lips.' },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: above them the nose and the eyes, below them the chin and the chest.' },
      z: { plus: 'to singer’s right', minus: 'to singer’s left', label: 'ACROSS', blurb: 'Toward the singer’s right or left (z).' },
    },
    instrument: {
      figureBadge: 'A singer, standing, seen from the right · every part named',
      figureLabel: 'A singer standing in profile.',
      partsBadge: 'A singer standing · tap a part to name it',
      partsLooking: { side: 'Side view · from the singer’s right', top: 'Top view · from above' },
      partsIdle: 'The voice starts as a buzz low in the throat, is shaped by the throat and the mouth, and leaves through the mouth — the next steps show how. Tap the mouth, the nose, the throat or the chest.',
      variantNotes: o.variantNotes ?? {
        studio: 'IN THE STUDIO: closed-back headphones on, the loudspeakers off — the mic hears the voice, not the track. Switch WHERE to see the stage.',
        live: 'ON STAGE: no headphones; a floor wedge in front of the singer, facing back at them. Switch WHERE to see the studio.',
      },
    },
    setting: {
      kitA11y: 'A singer standing, from above.',
      kitLanding: 'Tap anything around the singer. There is nothing to answer yet.',
      kitIdle: 'Everything around the singer is either their space or something the mic can hear.',
      leftHanded: '',
      stageA11y: 'A singer on a stage, from above.',
      studioA11y: 'A singer in a studio room, from above.',
      stageIdle: 'A floor wedge feeds the singer; the PA faces the audience; the band is loud.',
      studioIdle: 'No monitors on the floor: closed-back headphones, the loudspeakers off.',
      before: o.before,
    },
    placement: {
      workedZone: { studio: o.worked.studio, live: o.worked.live },
      workedLine: 'This starting point also reads how far the mic is off {line}: the dashed line straight out of the lips.',
      workedAim: 'Aim it at the mouth — between the nose and the mouth is a good place to point; the lab counts it while the mic points within about {tol}° of the mouth. Distance, height and angle are separate things to try.',
      workedClear: 'Clear of the singer: the mic, its screen and its stand keep off the face and away from where the head moves, and the base and cable stay clear of the feet. Clearance comes first, before any number.',
      blocked: {},
      reveal: 'Closer tends to bring more low end, breath and pops; farther, more room and a steadier level; a little lower or to one side, softer S sounds. Singers and rooms vary, so “it depends on this singer” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
      typeNotes: {
        vocLdc: 'Ideas to try with the studio condenser: keep its screen at least 10 cm in front of it, angled a little off parallel, then change one thing at a time — the distance, then the height — and have the singer perform the real material each time.',
        vocLdcOpen: 'Ideas to try without a screen: raise the mic to about eye level and angle it down at the mouth, so the air from the lips passes beneath it.',
        vocDynCard: 'Ideas to try with a handheld dynamic: let the singer find one steady distance; closer adds low end, farther adds the room or the stage. Keep the grille open — never cupped.',
        vocDynSuper: 'Ideas to try with a supercardioid: its rear lobe means a wedge goes a little to one side of its rear, not straight behind it — check the actual pattern.',
        vocHeadset: 'Ideas to try with a headset: place the capsule where its maker says, near the corner of the mouth, out of the breath; then leave it there.',
      },
      note: 'Clearance comes first: nothing touches the face or gets in the way of the singer’s movement, and the stand’s base and cable stay clear of the feet. Ask before moving a mic near someone’s face.',
      availableLead: 'Starting points for this mic',
      learn: {
        intro: `What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic on ${o.what}, measured from the lips to the front of the mic. They are starting points, not rules. Move from there and listen: there is no single right answer, and every singer, song and room is different.`,
        separate: 'Distance, height and the angle off the mouth’s axis are separate variables: change one at a time, and have the singer perform the real material each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
        clearance: 'Clearance comes first. The mic, the screen and the stand keep clear of the face and the head’s movement, the base and cable clear of the feet.',
        tendencies: 'Closer tends to sound fuller and more intimate, with more breath, pops and low end from a directional mic (the proximity effect); farther, more room and a steadier level; off the line of the mouth, softer S and T sounds. These are tendencies, and voices vary.',
      },
    },
    context: {
      variant: 'live',
      zone: o.liveZone,
      typeId: 'vocDynCard',
      patterns: [
        { id: 'cardioid', label: 'cardioid', typeId: 'vocDynCard' },
        { id: 'supercardioid', label: 'supercardioid', typeId: 'vocDynSuper' },
      ],
      micNoun: 'A handheld vocal dynamic',
      shield: [],
      azMax: 60,
      elMax: 60,
      aimBlurb: 'Swing the front up to 60° either way — it still faces the mouth.',
      plan: { u0: -500, u1: 1400, v0: -650, v1: 650 },
      side: { u0: -500, u1: 1400, v0: -450, v1: 1650 },
      target: 'wedge',
      frontIds: [],
      targetWord: 'wedge',
      looking: 'The singer on a stage · the wedge on the floor in front',
      prompt: 'The singer’s wedge stays where they need it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the mouth.',
      activityDone: 'done — the wedge sat in a null by your aim or pattern',
      deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
      cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Aimed level at the mouth, its rear points out over the audience — the wedge, down on the floor in front, sits well below that line, near where a supercardioid rejects most. So tilting the mic matters as much as turning it, and the pattern decides where the wedge goes.',
      shieldNote: 'The singer’s head and body reflect the wedge’s sound too, and the free-field pattern cannot show that. Listen with the monitors on — at the agreed level.',
      studioId: o.studio.id,
      studioPrompt: o.studio.prompt,
      studioNote: o.studio.note,
      learn: {
        intro: 'These are scenario-based comparisons, not restrictions: the singer is the same — the room, the band and the monitors change.',
        points: o.contextPoints ?? [
          { title: 'PERSPECTIVE', text: 'Studio: a mic 10–30 cm out, a screen or a grille against the air, the room part of the sound. Live: a handheld dynamic within about 10 cm, close enough to stay ahead of the band.' },
          { title: 'SPILL AND FEEDBACK', text: 'Studio: the headphone mix leaking from open-back phones, and the room. Live: the wedge, the PA and the band. Put the wedge where the pattern rejects most: straight behind a cardioid, a little to one side of a supercardioid’s rear.' },
          { title: 'MOVEMENT', text: 'Singers move. A steady distance matters more than the exact one: rehearse a working zone, or use a headset that moves with the head.' },
          { title: 'THE LOUDEST NOTE', text: 'A voice can top 135 dB right at the lips. Set gain on the loudest real passage — the first full take is often louder than the soundcheck.' },
        ],
        body: 'With a wedge in front of the singer, a pattern’s rejection is a tool to aim. Some stage sound in a vocal mic is normal; the question is how much the music can take.',
        warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency. Do not cup the grille: it changes the pattern and brings feedback closer.',
      },
    },
    twoMic: {
      variant: 'studio',
      A: { typeId: 'vocDynCard', pattern: 'cardioid', zone: o.pairA },
      B: { typeId: 'vocDynCard', pattern: 'cardioid', pose: o.pairB },
      learn: [
        'Two mics on one singer — two mics side by side to compare, or a second mic to blend — hear the voice at slightly different times. A comparison is made one mic at a time, at matched distance and level; a blend is a choice for a reason, not a requirement.',
        'When two go in together: hear each alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
      ],
      warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. Real mics at different distances and angles hear different mixes of voice and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
    },
    practice: o.practice,
    terms: {
      instrument: 'the singer',
      aimRef: 'the mouth’s axis',
      startIntro: o.startIntro,
      startNew: 'Good — NEXT takes you through the voice first. You can change how you started here at any time.',
      refTitle: 'MEASURED FROM',
      otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic. The same number from the chin or the nose would put the mic somewhere else.',
      noAim: 'This starting point gives no aim, so the mic simply faces the mouth. Distance, height and angle are still separate things to try.',
      clipMount: 'Mount: a headset the singer wears, its thin boom from over the ear — set where its maker says',
      standMount: 'Mount: a weighted boom stand, its base and cable clear of the singer’s feet',
      inPath: 'head in path',
      facing: 'facing the mouth',
      observation: 'For a real singer, with their agreement, and the singer stopped while anything near their face moves. Write tendencies in words — what you heard, not a promised result.',
    },
  };
}
