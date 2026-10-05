/**
 * I05a COWBELL — the pages' words, through the family builder
 * (smallperc/copy.ts). Starting-points voice; no source, brand or model names.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { spCopy } from '../shared/smallperc/copy.ts';
import { STATES } from './model.ts';

export const BELL_COPY: LessonCopy = spCopy({
  noun: 'cowbell',
  the: 'the bell',
  p: 'bell',
  variantKey: 'HELD',
  variantShort: { mounted: 'on a stand', handheld: 'held in the hand' },
  subject: { mounted: 'a 7 in cowbell on a stand’s clamp, struck with a stick', handheld: 'a 7 in cowbell held in the left hand, struck with a stick' },
  origin: { mounted: STATES.mounted.c, handheld: STATES.handheld.c },
  refWords: 'the bell',
  instrument: {
    figureBadge: 'A 7 in cowbell, struck with a stick',
    figureLabel: 'Side view of a cowbell — a tapered steel box with a bright rim at its open mouth — on a stand’s clamp, a stick in the player’s right hand resting on its top near the mouth.',
    partsBadge: 'A cowbell · tap a part to name it',
    partsLooking: { side: 'Side view · the bell’s side face', top: 'From above · the top face' },
    partsIdle: 'A tapered steel box, open at the mouth, struck with a stick: the whole metal body rings. The next page shows how — and what a mute changes.',
    variantNotes: {
      mounted: 'MOUNTED: the bell stays put while the stick moves round it — the stick’s path sets the clearance; the clamp can buzz or pass vibration to the stand.',
      handheld: 'HANDHELD: the grip changes the ring and the bell moves — treat it like a moving source, and place for the whole travel.',
    },
  },
  sound: {
    subject: 'The cowbell from the side, drawn large',
    looking: { mounted: 'The bell from the side, drawn large', handheld: 'The bell from the side, drawn large' },
    cells: [
      { k: 'STICK', at: ['STRIKES', 'REBOUNDS', 'AWAY', 'AWAY'], flex: 1 },
      { k: 'WALLS', at: ['STRUCK', 'FLEX', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'SUSTAIN', 'WHOLE BODY'], flex: 1.1 },
    ],
    reveal: 'The stick’s contact is the attack; then the steel walls flex and ring on — the sustain — and the WHOLE body radiates, not only the mouth.',
    after: 'The shell, its shape and alloy, the mount, the stick and the strike spot all change the attack and the ring — so soundcheck the soft touch and the forceful one.',
    shapesNotes: ['The bell is struck metal, not a horn: a brass instrument’s “aim into the bell” does not carry over. The pictures show where the sound starts — never its level.'],
    coupledSubject: 'The cowbell from the side',
    coupledNote: 'A ring too long for the part? Try the instrument and a secure, compatible mute before any processing — a mute changes the pitch and the level, not only the decay.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: “low pitch” or “tuned to G” are model descriptions, not pure tones. The pictures show where the sound comes from and where it leaves.',
    pair: {
      title: 'Open or muted',
      badge: 'A simplified picture: how freely the walls move, not how loud · motion drawn larger',
      looking: 'The bell from the side',
      prompt: 'Drag SWING to flex the walls, then switch RING. Watch how far they move.',
      key: 'RING',
      rest: 'the walls at rest',
      cells: ['RING', 'THE WALLS', 'YOU HEAR'],
      together: {
        option: 'OPEN',
        blurb: 'Nothing touching the steel: the walls ring freely after each stroke.',
        short: 'OPEN',
        title: 'AN OPEN BELL',
        card: 'Nothing damps the walls: they flex and ring on after each stroke — a long, open sustain that can cover the next note in a busy part.',
        v0: 'OPEN',
        v1: 'RING FREELY',
        air: { plus: 'LONG RING', minus: 'LONG RING', rest: 'LONG RING' },
      },
      opposed: {
        option: 'MUTED (A CUSHION OR MAGNET)',
        blurb: 'A soft cushion in the mouth, or a magnetic mute on the side, damps the walls.',
        short: 'MUTED',
        title: 'A MUTED BELL',
        card: 'A cushion in the mouth or a magnetic mute damps the walls: a shorter ring — a small mute takes the edge off; a large one muffles the sustain and lowers the pitch. It must stay secure and clear of the stick.',
        v0: 'MUTED',
        v1: 'DAMPED',
        air: { plus: 'SHORTER', minus: 'SHORTER', rest: 'SHORTER' },
      },
    },
  },
  setting: {
    kitA11y: 'A stage from above: a drum kit with the cowbell clamped near it, a timbales and percussion station beside it, an amp upstage, a vocal mic downstage.',
    kitLanding: 'Tap anything around the cowbell — or step through ITEM — to see what it means for a cowbell mic. There is nothing to answer yet.',
    kitIdle: 'A cowbell lives on a kit or a timbales rig: cymbals and snare a hand’s width away, overheads above — and a stick moving round it.',
    leftHanded: 'Players set the bell where their hand falls — check this rig, every strike point and every fill.',
    stageA11y: 'The band on a stage, from above: the kit and percussion, a floor monitor downstage facing back toward them, the player’s own monitor behind, the audience and the PA.',
    studioA11y: 'The band in a studio room, from above: the kit and percussion, overheads above them, the room’s walls, no monitors.',
    stageIdle: 'Two floor monitors: one downstage facing back toward the player, and the player’s own behind them. The PA faces the audience.',
    studioIdle: 'No monitors. The kit or percussion overheads may already carry the bell — and the room is part of the sound.',
    before: [
      { title: 'MARK THE STICK’S PATH', text: 'Watch every strike point, the fills, the rebound and the crossover motions. A mic is never a target in the player’s groove.' },
      { title: 'THE BELL FIRST', text: 'Shell, shape, alloy, mount, beater and touch all shape the sound. If the ring is too long, try the bell or a compatible, secure mute before processing.' },
      { title: 'HEARING AND HANDS', text: 'Struck metal is bright and loud beside the player’s ear. Never reach into an active striking area to adjust a mic; secure the bell, mount, boom and cable.' },
    ],
    planTitle: 'On the kit and the percussion rig',
  },
  placement: {
    workedZone: { mounted: 'bell.side.mounted', handheld: 'bell.side.handheld' },
    workedAim: 'Face the bell — the starting point counts while the mic faces it within {tol}°. Distance, height and angle are separate things to try.',
    reveal: 'From the side, more of the body and its ring; from above, more of the struck face and the attack; closer, less room and more spill control — or more harsh attack. Bells vary, so “it depends” is fair too.',
    typeNotes: { smallDynCard: 'A cardioid dynamic or a condenser can both work; listen through full-volume playing and move back when needed.' },
    note: 'Clearance comes first: stop the player before moving a real mic — the stick’s path and rebound set the minimum gap, not the bell. Watch PEAK meters: close strikes can overload an input.',
    learn: {
      intro: 'What you just did, in words. After our research, a mic about 20–40 cm (8–16 in) from a useful side or top view of the bell is where we recommend you begin — a common minimum for percussion is about 30 cm, so the near end of that range must still clear every stroke. Starting points, not rules.',
      separate: 'Distance, height and angle are separate variables: change one at a time. Do not assume a mic pointed into the mouth is fuller or brighter — the whole body radiates.',
      clearance: 'Clearance comes first. The stick’s path, its rebound and every fill define the minimum; rehearse them after every clamp or mic adjustment. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear.',
      tendencies: 'Painfully sharp? A little more distance, another safe angle, or a bell, beater or mute that fits the part. Too far back against the cymbals? Improve the bell-to-mic versus cymbal-to-mic relationship by placement and pattern. All tendencies to check by ear.',
    },
  },
  context: {
    variant: 'mounted',
    zone: 'bell.side.mounted',
    shield: ['bell.body.mounted'],
    facing: 'the bell',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: do the overheads already carry the bell?',
    studioNote: 'Bring up the main and overhead mics first; a spot is added only if the bell needs its own level — and checked with them in mono. Switch back to LIVE for the monitor exercise.',
    points: [
      { title: 'OVERHEAD OR SPOT', text: 'Overheads often carry a mounted bell in balance with the kit; a spot gives its own level at the cost of snare and cymbal spill and a second arrival.' },
      { title: 'A DEDICATED SPOT', text: 'A compact directional mic on a secure stand or clamp that does not touch the bell or pass mechanical noise — rehearse the stick after every change.' },
      { title: 'THE PATTERN’S NULLS', text: 'Cardioid rejects most behind; supercardioid and hypercardioid have rear lobes and side-rear nulls — aim by the real polar plot and verify at soundcheck.' },
      { title: 'NO MORE WEDGE', text: 'Avoid making the monitor louder just to hear a bell that is already loud beside the player.' },
    ],
  },
  twoMic: {
    variant: 'mounted',
    A: 'bell.side.mounted',
    B: 'bell.top.mounted',
    learn: [
      'A common situation: the bell spot, and the kit’s overheads that hear the bell too. Each hears it at a different time; EQ cannot separate the bell from a cymbal in the same spot.',
      'Combine the spot with the overheads and check in MONO for unpleasant tone changes; adjust the spot’s distance, angle or balance — or decide the overheads already suffice.',
    ],
  },
  facing: 'facing the bell',
  reference: 'bell',
  axis: 'the line to the bell',
});
