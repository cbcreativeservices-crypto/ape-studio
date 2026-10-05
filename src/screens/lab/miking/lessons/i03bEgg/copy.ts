/**
 * I03b EGG SHAKER — the pages' words, through the family builder
 * (smallperc/copy.ts). Starting-points voice; no source, brand or model names.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { spCopy } from '../shared/smallperc/copy.ts';
import { P0 } from '../shared/smallperc/geom.ts';

export const EGG_COPY: LessonCopy = spCopy({
  noun: 'egg shaker',
  the: 'the eggs',
  p: 'egg',
  variantKey: 'EGGS',
  variantShort: { one: 'one egg', two: 'two eggs close together', apart: 'two eggs, hands apart' },
  subject: { one: 'one egg shaker in the right hand', two: 'an egg shaker in each hand, the hands close together', apart: 'an egg shaker in each hand, the hands wide apart' },
  origin: { one: P0, two: P0, apart: P0 },
  refWords: 'the middle of the playing area (or the egg a spot faces)',
  instrument: {
    figureBadge: 'An egg shaker in a loose fist',
    figureLabel: 'Side view of a player’s right hand holding a small egg-shaped shaker in a loose fist, in front of the chest.',
    partsBadge: 'Egg shakers · tap a part to name it',
    partsLooking: { side: 'Side view · the hand from the right', top: 'From above · the hands and the eggs' },
    partsIdle: 'A small closed shell with grains inside and no handle, held in the hand — so the grip is part of the instrument. The next page shows how the grains make the sound.',
    variantNotes: {
      two: 'TWO, CLOSE: an egg in each hand, the hands near each other — one mic aimed between them can often take in both.',
      apart: 'HANDS APART: the hands wide apart, each playing its own part — one spot per hand becomes an option, with its costs.',
    },
  },
  sound: {
    subject: 'One egg shaker drawn large and cut open, with its grains inside',
    looking: { one: 'One egg drawn large · cut open', two: 'One of the eggs drawn large · cut open', apart: 'One of the eggs drawn large · cut open' },
    cells: [
      { k: 'EGG', at: ['MOVING', 'STOPS, TURNS', 'MOVING BACK', 'MOVING BACK'], flex: 1.1 },
      { k: 'GRAINS', at: ['LAG', 'KEEP GOING', 'STRIKE', 'SETTLING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', 'ATTACK', 'FROM THE SHELL'], flex: 1.1 },
    ],
    reveal: 'The grains lag the shell, keep going when the stroke turns, and strike the inside of the shell — that burst is the attack; rolling along the wall gives the wash.',
    after: 'Then the next stroke starts it again. The shell, the grains, the grip and the wrist all change the balance — and an egg’s two directions need not sound the same.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level. A few beads stand for the grains.'],
    coupledSubject: 'One egg drawn large',
    coupledNote: 'The grip is part of the instrument: a palm over the shell shields and damps part of it. Ask for the grip the player will really use before you place a mic.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real egg sounds depends on its shell, its grains, the grip and the player. The pictures show where the sound comes from and where it leaves.',
    pair: {
      title: 'The grip',
      badge: 'A simplified picture: where the sound can leave, not how loud · the palm drawn as a shape',
      looking: 'One egg drawn large · cut open',
      prompt: 'Drag SWING through a stroke, then switch GRIP. Watch where the sound can leave.',
      key: 'GRIP',
      rest: 'the middle of a stroke',
      cells: ['GRIP', 'THE SHELL', 'OUT'],
      together: {
        option: 'FINGERTIPS (SHELL OPEN)',
        blurb: 'Held in the fingers: the shell is open to the air all round.',
        short: 'OPEN',
        title: 'HELD IN THE FINGERTIPS',
        card: 'Held lightly in the fingers, the shell meets the air all round: the grains’ impacts leave in every direction.',
        v0: 'FINGERTIPS',
        v1: 'OPEN',
        air: { plus: 'ALL ROUND', minus: 'ALL ROUND', rest: 'ALL ROUND' },
      },
      opposed: {
        option: 'CUPPED (PALM OVER IT)',
        blurb: 'The palm cupped over part of the shell: that side is shielded and damped.',
        short: 'CUPPED',
        title: 'CUPPED IN THE PALM',
        card: 'A palm over part of the shell shields and damps that side: less leaves toward a mic on the covered side, and the sound itself can soften. The player’s grip is theirs — place the mic for it.',
        v0: 'CUPPED',
        v1: 'PART COVERED',
        air: { plus: 'LESS THAT SIDE', minus: 'LESS THAT SIDE', rest: 'LESS THAT SIDE' },
      },
    },
  },
  setting: {
    kitA11y: 'A percussion station from above: the egg player in the middle, other percussion beside them, a drum kit and an amp upstage, a singer’s microphone downstage.',
    kitLanding: 'Tap anything around the egg player — or step through ITEM — to see what it means for an egg mic. There is nothing to answer yet.',
    kitIdle: 'Egg shakers are quiet and small; around them, loud neighbours — cymbals, drums, amps and voices. The egg chosen matters as much as the mic.',
    leftHanded: 'Players use one egg or two, in either hand — check the real part and how far apart the hands go.',
    stageA11y: 'The band on a stage, from above: the percussion station, a floor monitor downstage facing back toward it, the player’s own monitor behind them, the audience and the PA.',
    studioA11y: 'The band in a studio room, from above: the percussion station, an area mic above it, the room’s walls, no monitors.',
    stageIdle: 'Two floor monitors: one downstage of the station facing back toward it, and the player’s own behind them. The PA faces the audience.',
    studioIdle: 'No monitors. An area or ensemble mic may already carry the eggs — and the room is part of the sound.',
    before: [
      { title: 'CHOOSE THE EGG FIRST', text: 'Eggs come in softer and louder versions for different settings — labels, not calibrated levels. Audition alternatives in context before you add channel gain.' },
      { title: 'WATCH BOTH HANDS', text: 'Ask for the whole part with its largest gesture: one egg or two, how far apart the hands go, and the grip the player really uses.' },
      { title: 'SMALL PARTS', text: 'A damaged shell can spill its grains: retire it, and keep small loose parts away from children. Keep the stand and cable outside both hands’ paths.' },
    ],
    planTitle: 'At the percussion station',
  },
  placement: {
    workedZone: { one: 'egg.front.one', two: 'egg.between.two', apart: 'egg.right.apart' },
    workedAim: 'Face the playing area — the starting point counts while the mic faces it within {tol}°. Distance, height and angle are separate things to try.',
    reveal: 'A closer stroke tends to jump out; a palm over the shell can hide part of it; two eggs may need a mic between them — or, wide apart, one each. Eggs and players vary, so “it depends” is fair too.',
    typeNotes: { smallDynCard: 'A suitably placed dynamic can be useful amid stage spill if there is enough gain; a small condenser tends to show more detail. Compare by ear.' },
    note: 'Clearance comes first: stop the player before moving a real mic. A quiet egg tempts very close miking — which makes level jumps, handling noise and off-axis changes more obvious.',
    learn: {
      intro: 'What you just did, in words. After our research, a mic about 30–60 cm (1–2 ft) from the middle of the usual playing area, aimed into it, is where we recommend you begin; a common minimum for percussion is about 30 cm. With two eggs close together, one mic between them; wide apart, perhaps one each. Starting points, not rules.',
      separate: 'Distance, height and angle are separate variables: change one at a time, with the same grip and phrase. The distance is to the middle of the motion, not to the nearest excursion.',
      clearance: 'Clearance comes first. At 30 cm a hand may still come close in a big stroke — check the real closest approach. The hatched areas show roughly where to keep clear.',
      tendencies: 'If one stroke leaps in level, move back or recentre; if the egg is buried, try closer outside the path, better rejection, or a louder egg. All tendencies to check by ear.',
    },
  },
  context: {
    variant: 'one',
    zone: 'egg.front.one',
    shield: ['egg.shell0.one'],
    facing: 'the egg',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: does the egg need its own mic — and which egg?',
    studioNote: 'In a quiet overdub, choose an egg whose level and grain suit the part; one mono spot often does everything. Switch back to LIVE for the monitor exercise.',
    points: [
      { title: 'THE EGG, THEN THE GAIN', text: 'A weak egg in a loud setting cannot be rescued by turning up its spot: that turns up the spill too. Move the source, choose a louder egg, or change the layout.' },
      { title: 'ONE STATION MIC', text: 'A dedicated directional mic for shakers and tambourine is a real touring approach — it does not say where an egg sits; check the real part.' },
      { title: 'THE PATTERN’S NULLS', text: 'Cardioid rejects most behind; supercardioid and hypercardioid have rear lobes and side-rear nulls. An omni is generally unsuitable for a loud monitored stage.' },
      { title: 'NO EGG-MOUNTED MIC', text: 'Avoid attaching a mic or cable to a small egg unless a purpose-built system and the player’s technique make it safe and useful.' },
    ],
  },
  twoMic: {
    variant: 'apart',
    A: 'egg.right.apart',
    B: 'egg.left.apart',
    learn: [
      'Two spots — one per hand — give independent control, but each mic also hears the other egg, a little later. Decide from the arrangement and the movement, not from the fact that there are two hands.',
      'Compare one central mic with the two spots, together and in MONO. If one hand disappears, check its egg and the palm before adding a channel.',
    ],
  },
  facing: 'facing the playing area',
  reference: 'playing area',
  axis: 'the line to the playing area',
});
