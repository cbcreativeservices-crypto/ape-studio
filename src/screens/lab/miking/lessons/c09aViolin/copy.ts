/**
 * C09a VIOLIN / FIDDLE — the shared pages' violin words (engine/model/
 * copy.ts). Starting-points voice (owner ruling 2026-10-04): no sources,
 * brands or badges. Every number is from violin/SOURCES.md or a named
 * drawing default; the 0.5–1.2 m stand distance is the lesson's own modest
 * suggestion (V-01).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const VIOLIN_COPY: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { standing: 'standing', seated: 'seated' },
  sceneSubject: { standing: 'a violin held under the chin by a standing player', seated: 'a violin held under the chin by a seated player' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the violinist (x). Distances are read from the bridge, or the part the starting point names.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The violin sits at the player’s shoulder, tilted toward the bow.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the violinist’s left (the scroll) or right (the bow arm) (z).' },
  },
  instrument: {
    figureBadge: 'A violin face-on, and its bow · every part named',
    figureLabel: 'A violin seen face-on with its bow.',
    partsBadge: 'A violin held under the chin · tap a part to name it',
    partsLooking: { side: 'Side view · from the violinist’s right', top: 'Top view · from above' },
    partsIdle: 'The bow sets the strings vibrating; the bridge carries that into the small hollow body, which sends it into the room — the next page shows how. The player holds it at the shoulder and the bow sweeps out to the right.',
    variantNotes: { seated: 'SEATED: the same hold, about 45 cm lower — the knees, the chair and the floor come closer to a stand’s base. Switch POSTURE to stand the player up.' },
  },
  placement: {
    workedZone: { standing: 'vn.front', seated: 'vn.front' },
    workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line the strings follow.',
    workedAim: 'Aim it at the bridge and the top round it — the lab counts it while the mic points within about 25° of the bridge. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the bow’s full sweep, the bow arm out to the tip of a stroke, the player’s head and the violin itself. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Closer tends to bring more of the bow — articulation, and some scratch; farther, more of the whole violin and the room. Violins and rooms vary, so “it depends on this violin” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: begin in front and a little above, aimed at the bridge; then move one thing at a time — the distance, the height, the angle — and play the G and the E strings each time.',
      strMini: 'Ideas to try with a miniature: keep its clip or holder where it is made to go, then change only the capsule’s angle — toward the bridge for more brightness, toward an f-hole for more level and a duller colour.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, clip or cable anywhere the bow, the bow arm or the player’s head can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the bridge, where the bow meets the strings, the side, or the bridge’s foot. They are starting points, not rules — the stand distances especially are modest suggestions. Move from there and listen: there is no single right answer, and every violin and room is different.',
      separate: 'Distance, height and the angle across the top are separate variables: change one at a time, and play all four strings, quiet bow starts and the loudest passage each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable out of the bow’s full sweep (both ends of the bow), the bow arm at the tip of a stroke, and the player’s head. The bow’s keep-clear area appears as the mic gets close — in red, with the reason, if a move is stopped — and shows roughly where the bow travels — leave more room on a real stage.',
      tendencies: 'Toward the bridge and the bow tends to bring more articulation and scratch; toward an f-hole, more body and level, sometimes a duller colour; farther, more of the whole violin and the room. A directional mic up close also lifts the lows (proximity effect). These are tendencies, and violins vary.',
    },
  },
  context: {
    variant: 'standing',
    zone: 'vn.front',
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
    aimBlurb: 'Swing the front up to 60° either way — it still faces the violin.',
    plan: { u0: -900, u1: 2200, v0: -1500, v1: 1100 },
    side: { u0: -900, u1: 2200, v0: -1100, v1: 1560 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic in front of the violin',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the violin.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). In front of the player and aimed back at the violin, its rear faces the audience side — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'Even a small violin’s top REFLECTS stage sound into the front of a mic aimed away from it — the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'vn.ctx.studio',
    studioPrompt: 'A studio session, a solo classical violin, a good room: what is the mic’s job?',
    studioNote: 'In the studio, a mic in front and above can carry the whole violin and some room; a closer one adds definition when the arrangement needs it. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: violin and fiddle are the same instrument — the difference is the music and the setting.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a classical solo may want the room and a balanced line. Live: a fiddle beside a banjo and drums may need a closer, more separated sound.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the neighbours. Live: monitors, the PA and the band. A closer mic, the right pattern and aim help — and the violin’s top still reflects some stage sound into the mic.' },
        { title: 'MOVEMENT', text: 'Violinists move with the music. A stand mic has a working zone — mark it, and the bow-safe way in; a miniature on the violin keeps one distance as the player turns.' },
        { title: 'IN A GROUP', text: 'With a main pair up, a violin mic is a spot: raise it only for a stated balance, and check it in mono so it does not pull the player forward.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a violin mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'standing',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'vn.close' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'vn.front' },
    learn: [
      'A second mic — a room mic, or a main pair the violin plays into — is a choice for a reason, not a requirement for stereo: the violin is small, and two close mics on it can move the image as the player turns.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
    ],
    warn: 'This simplified graph treats the violin as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of body and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'vn.prac.gain',
    second: 'vn.prac.3',
    mixed: ['vn.mix.1', 'vn.mix.2', 'vn.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the violin',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a violin — or a fiddle: the same instrument in different music. First the violin itself: what it is, how the bow and the strings make its sound, and where the player stands or sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the violin first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part of the violin — the top, the side, where the bow meets the strings — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the violin. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip or holder made for this instrument — on the side, or on two strings behind the bridge — with the player’s agreement',
    standMount: 'Mount: a stand placed clear of the bow’s sweep, the bow arm and the player',
    inPath: 'violin in path',
    facing: 'facing the violin',
    observation: 'For a real violin, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
