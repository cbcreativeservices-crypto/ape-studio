/**
 * THE DOUBLE BASS's page words, shared by C06a (plucked) and C06b (bowed):
 * one function per playing approach, so the two lessons read as one
 * instrument and differ only where plucking and bowing differ.
 * Starting-points voice (owner ruling 2026-10-04): no sources on screen.
 */
import type { LessonCopy } from '../../../engine/model/copy.ts';
import type { SettingItem } from '../../../engine/model/types.ts';

export type BassKind = 'pluck' | 'bow';

export function bassCopy(kind: BassKind, ids: { worked: string; context: string; twoA: string; twoB: string; prefix: string; studioId: string }): Partial<LessonCopy> {
  const bowed = kind === 'bow';
  const hand = bowed ? 'the bow, the bow hand and the bow arm' : 'the plucking hand and the left hand on the neck';
  return {
    variantKey: 'POSTURE',
    variantShort: { standing: 'standing' },
    sceneSubject: { standing: bowed ? 'a double bass, bowed, the bassist standing behind it' : 'a double bass, plucked, the bassist standing behind it' },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the bassist (x). Distances are read from the strings just above the bridge, or the part the starting point names.' },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The bass leans back toward the player, so “in front of the strings” points a little upward.' },
      z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the bassist’s left (the G side) or right (the E side) (z).' },
    },
    instrument: {
      figureBadge: 'A double bass face-on, and its bow · every part named',
      figureLabel: 'A double bass seen face-on with its bow.',
      partsBadge: bowed ? 'A double bass, bowed · tap a part to name it' : 'A double bass, plucked · tap a part to name it',
      partsLooking: { side: 'Side view · from the bassist’s right', top: 'Top view · from above' },
      partsIdle: bowed ? 'The bow sets the strings vibrating; the bridge carries that into the large body — the next page shows how. The bassist stands behind it, the bow sweeping across just above the bridge.' : 'The fingers pull the strings and let them go; the bridge carries their vibration into the large body — the next page shows how. The bassist stands behind it and plucks a little above the bridge.',
      variantNotes: {},
    },
    placement: {
      workedZone: { standing: ids.worked },
      workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line the strings follow.',
      workedAim: 'Aim it back at the bridge area — the lab counts it while the mic points within about 25° of the strings just above the bridge. Distance, height and angle are separate things to try.',
      workedClear: bowed
        ? 'Clear of every part — the bow’s full sweep on both sides, the bow hand and arm, the left hand, the endpin and the feet. Clearance comes first, and the bassist stops before a real mic moves.'
        : 'Clear of every part — the plucking hand, the left hand on the neck, the bassist, the endpin and the feet. Clearance comes first, and the bassist stops before a real mic moves.',
      blocked: {},
      reveal: 'Higher toward the fingerboard tends to bring more finger (or bow) and pitch; lower toward the top and an f-hole, more body and output; farther, more of the whole instrument and the room. Basses and rooms vary, so “it depends on this bass” is fair too.',
      typeNotes: {
        strSdc: 'Ideas to try: start out in front, a little above the bridge; then move one thing at a time — a little higher toward the fingerboard, a little lower toward the top — and play low and high notes, soft and strong, each time.',
        strMini: 'Ideas to try with a miniature: keep its clip on the two outer strings below the bridge (never on the bridge), then change only the capsule’s angle — toward an f-hole gives more level.',
      },
      note: 'Clearance comes first: stop the bassist before moving a real mic. A mic, clip or cable anywhere ' + hand + ' can reach — or where a stand could tip onto the bass — is in the wrong place, whatever the number says.',
      availableLead: 'Starting points for this mic',
      learn: {
        intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the part it names — the strings just above the bridge, an f-hole, or the bridge’s foot. They are starting points, not rules: move from there and listen — there is no single right answer, and every bass, bassist and room is different.',
        separate: 'Distance, height and angle are separate variables: change one at a time, and play low and high notes, soft and strong, each time — a low note can boom from the room, not the mic. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
        clearance: bowed
          ? 'Clearance comes first. Stop the bassist before moving a mic; keep the mic, stand, clip and cable out of the bow’s full sweep (both ends, every string), the bow arm, and the endpin and feet. The grey hatched area shows roughly where the bow travels. A stand must never be able to tip onto the bass.'
          : 'Clearance comes first. Stop the bassist before moving a mic; keep the mic, stand, clip and cable out of the plucking hand’s reach, the left hand’s path along the neck, and the endpin and feet. A stand must never be able to tip onto the bass.',
        tendencies: 'Toward the fingerboard tends to bring more attack and pitch; toward an f-hole, more body and output — and the risk of a boomy note; very close, a directional mic adds low end (proximity effect). These are starting experiments, not guarantees.',
      },
    },
    context: {
      zone: ids.context,
      typeId: 'strSdc',
      patterns: [
        { id: 'cardioid', label: 'cardioid', typeId: 'strSdc' },
        { id: 'supercardioid', label: 'supercardioid', typeId: 'strSdc' },
        { id: 'hypercardioid', label: 'hypercardioid', typeId: 'strSdc' },
      ],
      micNoun: 'A small condenser',
      shield: ['bw.body', 'bw.bodyUpper', 'bw.bodyWaist'],
      azMax: 70,
      elMax: 45,
      aimBlurb: 'Swing the front up to 70° either way — it still faces the bass.',
      plan: { u0: -1100, u1: 2300, v0: -1600, v1: 1800 },
      side: { u0: -1100, u1: 2300, v0: -1200, v1: 860 },
      target: 'drums',
      frontIds: [],
      targetWord: 'drum kit',
      looking: 'Top view · mic in front of the bass',
      prompt: 'The drum kit stays where the drummer needs it. Turn the MIC (AIM) or change its PATTERN until the kit sits in the rejection — while the mic still points at the bass.',
      activityDone: 'done — the kit sat in a null by your aim or pattern',
      deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there — and least at low frequencies, which is where a bass and a kick drum live. Use the null to aim, not to promise silence.',
      cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). The kit is off to the side, not behind — turning the mic to put it there may also turn the mic off the bass.',
      shieldNote: 'The bass’s large body also REFLECTS the drums and the PA back into the front of a mic aimed away from them — the free-field pattern cannot show that. If the pattern alone fails, move the bassist, the drummer, the amp or the mic.',
      studioId: ids.studioId,
      studioPrompt: 'A studio, a good isolated room: what could a broad omni give the bass?',
      studioNote: 'In a good isolated room, an omni can capture the whole instrument and the room without directional proximity lift; a directional mic helps when the drums are close. Switch back to LIVE for the kit exercise.',
      learn: {
        intro: 'These are scenario-based comparisons, not restrictions: a natural room sound and a focused band sound ask for different choices.',
        points: [
          { title: 'PERSPECTIVE', text: 'Studio: one mic in front of the bridge at a moderate distance, then a little higher and lower. Live: what does the acoustic bass already give the room, and what must the PA add?' },
          { title: 'SPILL', text: 'Closer, with the rejection aimed at the drums, gives more bass and less kit — but the bass’s body reflects the kit into the mic too.' },
          { title: 'PICKUP AND MIC', text: 'On a loud stage a properly installed pickup often carries the low end, and the mic adds acoustic detail as far as feedback allows — each on its own channel.' },
          { title: 'FEEDBACK', text: 'A resonant bass can feed back. Lower the offending level, change the speaker, bass and mic geometry, and check the pickup channel separately.' },
        ],
        body: 'With a drum kit beside the bassist, a pattern’s rejection is a tool to aim — but low frequencies are hard to reject, and the body reflects. Moving people and amps is a fair answer too.',
        warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the bass amp, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
      },
    },
    twoMic: {
      A: { typeId: 'strSdc', pattern: 'cardioid', zone: ids.twoA },
      B: { typeId: 'strSdc', pattern: 'omni', zone: ids.twoB },
      learn: [
        'A strong single-mic sound is the reference. A second view — closer and farther, or a room mic — can add attack or space; keep it only if it helps in the mix.',
        'Hear each alone, then the pair in MONO at useful levels. If body disappears or notes change unpredictably, move or rebalance a mic first, then compare polarity and timing. Avoid an arbitrary spacing rule as a substitute for listening.',
      ],
      warn: 'This simplified graph treats the bass as one point and both mics as hearing the same sound. Read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. The low notes are where a bass pair thins first: judge by ear, in mono.',
    },
    practice: {
      gain: `${ids.prefix}.prac.gain`,
      second: `${ids.prefix}.prac.3`,
      mixed: [`${ids.prefix}.mix.1`, `${ids.prefix}.mix.2`, `${ids.prefix}.mix.3`],
      mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
    },
    terms: {
      instrument: 'the bass',
      aimRef: 'its reference',
      startIntro: bowed
        ? 'This lesson is about putting a microphone on a bowed double bass (arco) — but first the bass itself: what it is, how the bow keeps its long notes going, and where the bassist stands. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.'
        : 'This lesson is about putting a microphone on a plucked double bass (pizzicato) — but first the bass itself: what it is, how a plucked string makes its sound, and where the bassist stands. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
      startNew: 'Good — NEXT takes you through the bass first. You can change how you started here at any time.',
      refTitle: 'MEASURED FROM',
      otherRef: 'The same number measured from another part of the bass — the top, the bridge’s foot, an f-hole — would put the mic somewhere else.',
      noAim: 'This starting point gives no aim, so the mic simply faces the bass. Distance, height and angle are still separate things to try.',
      clipMount: 'Mount: a clip made for this instrument — on two strings below the bridge, never on the bridge — with the owner’s agreement',
      standMount: bowed ? 'Mount: a stable stand placed clear of the bow’s sweep, the endpin and the bassist’s feet' : 'Mount: a stable stand placed clear of the hands, the endpin and the bassist’s feet',
      inPath: 'bass in path',
      facing: 'facing the bass',
      observation: 'For a real bass, with the bassist’s agreement, and the bassist stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    },
  };
}

/** The neighbours on the plan, both lessons. */
export function bassSetting(kind: BassKind): SettingItem[] {
  const bowed = kind === 'bow';
  return [
    { id: 'bass', label: 'the double bass and the bassist', short: 'BASS', note: 'The bass stands on its endpin, leaning back against the bassist, who stands behind it. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'upright_bass_plucked/GEOMETRY_PROPOSAL.md §1 (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
    bowed
      ? { id: 'hands', label: 'the bow’s sweep and the bow arm', short: 'BOW', note: 'The bow crosses the strings a little above the bridge and travels its whole hair length both ways — out to the bassist’s right at the tip of a stroke. No mic, stand or cable goes in its path.', prov: { kind: 'illustrative', reason: 'upright_bass_bowed/GEOMETRY_PROPOSAL.md bow envelope' }, tag: 'KEEP CLEAR', scene: 'kit' }
      : { id: 'hands', label: 'the plucking hand', short: 'HANDS', note: 'The right hand plucks a little above the bridge up to the end of the fingerboard; the left hand moves along the neck. A mic, a clip and a cable stay clear of both.', prov: { kind: 'illustrative', reason: 'env.ub.pluck (proposal)' }, tag: 'KEEP CLEAR', scene: 'kit' },
    { id: 'endpin', label: 'the endpin and the feet', short: 'ENDPIN', note: 'The endpin’s point and the bassist’s feet share the floor. Keep stand bases and cables away — and never set a stand where it could tip onto the bass.', prov: { kind: 'illustrative', reason: 'proposal: endpin r 150, feet zone' }, tag: 'KEEP CLEAR', scene: 'kit' },
    { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'In a band the kit is often close by — loud, and the bass’s large body reflects it back into a mic aimed away from it.', prov: { kind: 'illustrative', reason: 'a typical small-band layout (Lab 1’s shared kit)' }, tag: 'SPILL', scene: 'kit' },
    { id: 'piano', label: 'the piano', short: 'PIANO', note: 'In a jazz trio the piano is the other neighbour: farther away, still heard.', prov: { kind: 'illustrative', reason: 'a typical trio layout' }, tag: 'SPILL', scene: 'kit' },
    { id: 'wedge', label: 'the bassist’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front of the bassist, facing back — and a bass amp nearby. Point them so they do not drive the bass body or the mic.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
    { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience hears the acoustic bass only a little; the PA — fed by a pickup, a mic or both — carries most of it.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
    { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges; a room’s low-frequency modes can make one note boom — check the room before reaching for EQ.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
  ];
}

export const BASS_HEARING = 'Protect your hearing on loud stages and during soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Manage the exposure time, keep monitoring sensible, and use hearing protection where it is loud.';
