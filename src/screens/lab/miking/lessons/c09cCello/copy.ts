/**
 * C09c CELLO — the shared pages' cello words (engine/model/copy.ts).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from cello/SOURCES.md or a named drawing default.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const CELLO_COPY: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { seated: 'seated' },
  sceneSubject: { seated: 'a cello, the cellist seated, its endpin on the floor' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the cellist (x). Distances are read from the bridge, or the part the starting point names.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The cello leans back toward the player, so “in front of the bridge” points a little upward.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the cellist’s left (the A-string side) or right (the bow-arm side) (z).' },
  },
  instrument: {
    figureBadge: 'A cello, played seated — the bow’s sweep hatched',
    figureLabel: 'Side view of a seated cellist: the cello leans back against the chest, its endpin on the floor, the bow across the strings just below the fingerboard, and the hatched sweep of the bow on both sides.',
    partsBadge: 'A cello, played seated · tap a part to name it',
    partsLooking: { side: 'Side view · from the cellist’s right', top: 'Top view · from above' },
    partsIdle: 'The bow (or a finger) sets the strings vibrating. The bridge carries that into the hollow body, and the body sends it into the room — the next page shows how.',
    variantNotes: {},
  },
  placement: {
    workedZone: { seated: 'vc.front' },
    workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line the strings follow.',
    workedAim: 'Aim it at the bridge and the top round it — the lab counts it while the mic points within about 25° of the bridge. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the bow’s full sweep on both sides, the bow arm, the cellist, the endpin and the feet. Clearance comes first, before any number, and the cellist stops before a real mic moves.',
    blocked: {},
    reveal: 'Moving away tends to bring in more of the whole cello — and of the room and the neighbours — and cellos vary, so “it depends on this cello” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      sdcCard: 'Ideas to try: start about a foot from the bridge, aimed at it; then move one thing at a time — the distance, the height, the angle across the top — and play both the low C and the high A each time.',
      strMini: 'Ideas to try with a miniature: keep the clip on the two outer strings below the bridge, then change only the capsule’s angle — toward the bridge for a natural sound, toward an f-hole for more level.',
    },
    note: 'Clearance comes first: stop the cellist before moving a real mic. A mic, clip or cable anywhere the bow, the bow arm or the endpin can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the part it names — the bridge, or the bridge’s foot. They are starting points, not rules: move from there and listen — there is no single right answer, and every cello and room is different.',
      separate: 'Distance, height and the angle across the top are separate variables: change one at a time, and play both the lowest and the highest string each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the cellist before moving a mic; keep the mic, stand, clip and cable out of the bow’s full sweep (both ends of the bow), the bow arm, and the endpin and feet on the floor. The grey hatched area shows roughly where the bow travels — leave more room on a real stage.',
      tendencies: 'Closer to the bridge tends to bring more bow and string detail; farther brings more of the whole body and the room. With a directional mic up close, proximity effect also lifts the low strings. These are tendencies, and cellos vary.',
    },
  },
  context: {
    zone: 'vc.front',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['bw.body', 'bw.bodyUpper', 'bw.bodyWaist'],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the cello.',
    plan: { u0: -900, u1: 2100, v0: -1300, v1: 1300 },
    side: { u0: -900, u1: 2100, v0: -1000, v1: 760 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the cello',
    prompt: 'The cellist’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the cello.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — which is where the cello’s lowest notes are. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Aimed back at the cello, its rear faces the audience side — a wedge down on the floor in front sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The cello’s large body also REFLECTS a monitor or a nearby drum kit back into the front of the mic, even when the mic points away from it — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'vc.ctx.studio',
    studioPrompt: 'A studio session, a solo cello, a good room: is a close mic needed at all?',
    studioNote: 'In the studio, a farther mic may carry the whole cello and the room; a close one adds definition when the arrangement needs it. Repeated trials are practical when the cellist stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a farther mic can suit a solo in a good room, and a close miniature can suit a quiet stage too.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: hear the whole cello in the room first; a farther mic often integrates body and room. Live: think about what the acoustic cello already gives the audience, and what the PA must add.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: neighbours and the room are the spill. Live: monitors, the PA and loud neighbours. A closer mic, the right pattern and the right aim help — and the body’s reflections still reach the mic.' },
        { title: 'MOVEMENT', text: 'A seated cellist sways. A stand mic has a working zone; a miniature on the strings keeps one distance as the player moves.' },
        { title: 'MOUNTING', text: 'Studio: paused sessions allow careful comparisons. Live: a clip made for this cello, a cable routed away from the endpin and the chair, and a full-motion check before the show.' },
      ],
      body: 'With a wedge in front of the cellist, a pattern’s rejection is a tool to aim — tilting the mic as well as turning it. Some stage sound in a cello mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'vc.front' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'vc.far' },
    learn: [
      'A second mic is a choice for a reason — the room, a balance, a spot under a main pair — not a requirement for stereo. Start with one cello mic you like on its own, and keep the second only if it helps.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
    ],
    warn: 'This simplified graph treats the cello as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of body and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'vc.prac.gain',
    second: 'vc.prac.3',
    mixed: ['vc.mix.1', 'vc.mix.2', 'vc.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the cello',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a cello — but first the cello itself: what it is, how the bow and the strings make its sound, and where it sits among the players. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the cello first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part of the cello — the top, an f-hole — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the cello. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip made for this instrument — on two strings below the bridge — with the player’s agreement',
    standMount: 'Mount: a stand placed clear of the bow’s sweep, the bow arm and the player’s feet',
    inPath: 'cello in path',
    facing: 'facing the cello',
    observation: 'For a real cello, with the cellist’s agreement, and the cellist stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
