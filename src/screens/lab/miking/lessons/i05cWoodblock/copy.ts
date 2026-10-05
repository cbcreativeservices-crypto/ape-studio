/**
 * I05c WOODBLOCK — the pages' words, through the family builder
 * (smallperc/copy.ts). Starting-points voice; no source, brand or model names.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { spCopy } from '../shared/smallperc/copy.ts';
import { STATES } from './model.ts';

export const WB_COPY: LessonCopy = spCopy({
  noun: 'woodblock',
  the: 'the block',
  p: 'wb',
  variantKey: 'SUPPORT',
  variantShort: { table: 'on a table', held: 'held in the hand' },
  subject: { table: 'a woodblock on a foam pad on a trap table, struck with a mallet', held: 'a woodblock held in the left hand, struck with a mallet' },
  origin: { table: STATES.table.spot, held: STATES.held.spot },
  refWords: 'the block — its playing surface or its opening',
  instrument: {
    figureBadge: 'A woodblock on foam, struck with a mallet',
    figureLabel: 'Side view of a woodblock seen from its end, a dark slot in the face toward the audience, resting on a foam pad on a trap table; a rubber mallet in the player’s right hand touches its top.',
    partsBadge: 'A woodblock · tap a part to name it',
    partsLooking: { side: 'Side view · the block from its end', top: 'From above · the top face' },
    partsIdle: 'A hardwood block with a slot cut into it, struck with a mallet — its support matters as much as the mic. The next page shows why.',
    variantNotes: {
      table: 'ON A TABLE: on foam, with space underneath — never laid flat on thick carpet or towels, which muffle it.',
      held: 'HELD: in the palm — the hand must not choke the opening, and the block moves a little: place for its usual position.',
    },
  },
  sound: {
    subject: 'The woodblock from its end, drawn large, the slot to the right',
    looking: { table: 'The block from its end, drawn large', held: 'The block from its end, drawn large' },
    cells: [
      { k: 'MALLET', at: ['STRIKES', 'REBOUNDS', 'AWAY', 'AWAY'], flex: 1 },
      { k: 'WALL', at: ['STRUCK', 'FLEXES', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'HOLLOW KNOCK', 'FROM THE OPENING'], flex: 1.3 },
    ],
    reveal: 'The strike just off the middle toward the opening flexes the thin wall over the slot; the wall and the air in the slot ring together — the hollow knock — and the opening sends much of it toward the audience.',
    after: 'The block, its support, the mallet and the stroke shape the sound before any mic does: a block laid on a towel gives a dead tap whatever the mic.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level; the wall’s flex is a drawn shape, much larger than real.'],
    coupledSubject: 'The woodblock from its end',
    coupledNote: 'Give the block space before you move a mic: space underneath (foam), the opening clear — then audition the mic positions.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: a maker’s “natural wooden sound” is a description, not a measured response. The pictures show where the sound comes from and where it leaves.',
    pair: {
      title: 'Foam or towel',
      badge: 'A simplified picture: how freely the wall moves, not how loud · motion drawn larger',
      looking: 'The block from its end',
      prompt: 'Drag SWING to flex the wall, then switch SUPPORT. Watch how far it moves.',
      key: 'SUPPORT',
      rest: 'the wall at rest',
      cells: ['SUPPORT', 'THE WALL', 'YOU HEAR'],
      together: {
        option: 'ON FOAM',
        blurb: 'On a foam pad: space underneath, able to ring.',
        short: 'FOAM',
        title: 'ON FOAM',
        card: 'On a foam pad, with space underneath, the block can ring: the wall over the slot flexes and rings with the air inside it — the full hollow knock.',
        v0: 'FOAM',
        v1: 'UNDAMPED',
        air: { plus: 'RINGS', minus: 'RINGS', rest: 'RINGS' },
      },
      opposed: {
        option: 'ON A THICK TOWEL',
        blurb: 'Laid flat on thick carpet or towels: muffled.',
        short: 'TOWEL',
        title: 'ON A THICK TOWEL',
        card: 'Laid flat on thick carpet or towels, the block is damped from below: a dead, short tap. Move the block to foam before you move a mic.',
        v0: 'TOWEL',
        v1: 'DAMPED',
        air: { plus: 'A DEAD TAP', minus: 'A DEAD TAP', rest: 'A DEAD TAP' },
      },
    },
  },
  setting: {
    kitA11y: 'A percussion station from above: the trap table with the woodblock, the player behind it, other percussion beside them, a drum kit and an amp upstage, a vocal mic downstage.',
    kitLanding: 'Tap anything around the woodblock — or step through ITEM — to see what it means for a woodblock mic. There is nothing to answer yet.',
    kitIdle: 'A woodblock waits on the trap table with the other small instruments; the player moves between them — and cymbals and drums sound nearby.',
    leftHanded: 'Players set the table to suit their hands — check this station, every instrument change and the mallet’s path.',
    stageA11y: 'The band on a stage, from above: the percussion station, a floor monitor downstage facing back toward it, the player’s own monitor behind them, the audience and the PA.',
    studioA11y: 'The band in a studio room, from above: the percussion station, an area mic above it, the room’s walls, no monitors.',
    stageIdle: 'Two floor monitors: one downstage of the station facing back toward it, and the player’s own behind them. The PA faces the audience.',
    studioIdle: 'No monitors. An overhead or main mic may already carry the woodblock — and the room is part of the sound.',
    before: [
      { title: 'GIVE THE BLOCK SPACE', text: 'Space underneath — foam, not thick carpet or towels — and the opening toward the audience where possible. Listen to the player’s mallet, stroke and support before moving a mic.' },
      { title: 'MARK THE MALLET’S PATH', text: 'The strike just off the middle toward the opening, the rebound, and a missed stroke. Stands, booms, clamps and cables stay outside all of it.' },
      { title: 'CHECK THE INSTRUMENT', text: 'No split block with loose fragments; mounted blocks secured against turning. Keep ears away from repeated loud demonstrations beside it.' },
    ],
    planTitle: 'At the trap table',
  },
  placement: {
    workedZone: { table: 'wb.opening.table', held: 'wb.opening.held' },
    workedAim: 'Face the block — the starting point counts while the mic faces its opening or its playing surface within {tol}°. Distance, height and angle are separate things to try.',
    reveal: 'From above, more strike and playing surface; toward the opening, a different balance of attack, hollow body, room and neighbours — not a rule that the opening sounds fuller. Blocks vary, so “it depends” is fair too.',
    typeNotes: { smallDynCard: 'A cardioid dynamic or condenser can both work; a closer live spot only where clearance and isolation are confirmed.' },
    note: 'Clearance comes first: stop the player before moving a real mic — never into the slot, never where a mallet can reach. Watch PEAK meters for the loudest real hit.',
    learn: {
      intro: 'What you just did, in words. After our research, a mic about 25–50 cm (10–20 in) from the block, outside the mallet’s path, is where we recommend you begin — from above toward the playing surface, or in front toward the opening. A common minimum for percussion is about 30 cm. Starting points, not rules.',
      separate: 'Distance, height and angle are separate variables: change one at a time with the whole pattern. Compare the two viewpoints at matched level.',
      clearance: 'Clearance comes first: the mallet’s whole path, its rebound and a missed stroke. Never put the mic into the slot. The hatched areas show roughly where to keep clear.',
      tendencies: 'A farther mic may bring in a pleasing room; a closer one stronger direct sound — with more impact and mount noise. Start with the support and the mallet before EQ. All tendencies to check by ear.',
    },
  },
  context: {
    variant: 'table',
    zone: 'wb.opening.table',
    shield: ['wb.block.table'],
    facing: 'the block',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: does the overhead or main mic already carry the block?',
    studioNote: 'Evaluate the main mics first; a spot only when the block needs its own level and the spot hears more block than spill. Switch back to LIVE for the monitor exercise.',
    points: [
      { title: 'SHARED OR SPOT', text: 'An overhead or area mic may carry the block in balance with the percussion; a spot gives control on a loud stage, if the block is close to it and far from the cymbals.' },
      { title: 'HARDWARE NOISE', text: 'A mic attached to nearby hardware can carry mechanical knocks: listen to the channel with the block silent while the rest of the kit plays.' },
      { title: 'THE PATTERN’S NULLS', text: 'Cardioid rejects most behind; supercardioid and hypercardioid have rear lobes and side-rear nulls — place the wedge by the real pattern.' },
      { title: 'NOT ENOUGH LEVEL', text: 'Lower nearby stage level or move the block if a clean spot cannot be had — never keep adding gain.' },
    ],
  },
  twoMic: {
    variant: 'table',
    A: 'wb.opening.table',
    B: 'wb.surface.table',
    learn: [
      'A common situation: a woodblock spot and the overhead or main mic that hears it too — or two blocks of a set on two spots. The same knock arrives at different times.',
      'Listen together and in MONO; there is no requirement for one mic per block — re-aim or rebalance before adding channels.',
    ],
  },
  facing: 'facing the block',
  reference: 'block',
  axis: 'the line to the block',
});
