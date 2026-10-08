/**
 * I02 CAJÓN — the pages' words, through the family builder
 * (smallperc/copy.ts). Starting-points voice; no source, brand or model names.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { spCopy } from '../shared/smallperc/copy.ts';
import { STATES } from './model.ts';

export const CAJ_COPY: LessonCopy = spCopy({
  noun: 'cajón',
  the: 'the cajón',
  p: 'caj',
  variantKey: 'PORT',
  variantShort: { rear: 'rear port', frontport: 'front port' },
  subject: { rear: 'a box cajón with its port on the back, the player seated astride the top', frontport: 'a front-port cajón, its port facing up through a low front ledge, the player seated on the top' },
  origin: { rear: STATES.rear.plate, frontport: STATES.frontport.plate },
  refWords: 'the middle of the front plate',
  instrument: {
    figureBadge: 'A cajón, the player seated on it',
    figureLabel: 'Side view of a wooden box cajón with a player sitting astride its top, leaning over to strike the front plate between the knees; the right hand at a top corner, the left near the middle; the port on the back.',
    partsBadge: 'A cajón · tap a part to name it',
    partsLooking: { side: 'Side view · the player seated on the box', top: 'From above · the box between the knees' },
    partsIdle: 'A wooden box the player sits on and strikes — an idiophone: the plate and the box vibrate, with no stretched head. The next page shows how.',
    variantNotes: {
      rear: 'REAR PORT: the round port is on the back, behind the player’s legs.',
      frontport: 'FRONT PORT: the port faces up through a low front ledge, and the playing surface sits back above it — the hole is NOT behind the player.',
    },
  },
  sound: {
    subject: 'The cajón cut open from the side, drawn large',
    looking: { rear: 'The box cut open, drawn large', frontport: 'The box cut open, drawn large' },
    cells: [
      { k: 'HAND', at: ['STRIKES', 'AWAY', 'AWAY', 'AWAY'], flex: 1 },
      { k: 'PLATE', at: ['STRUCK', 'FLEXES', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK + BUZZ', 'BOX AIR', 'PLATE + PORT'], flex: 1.3 },
    ],
    reveal: 'The stroke flexes the plate; at a top corner the wires inside buzz against it; the plate pushes the air in the box, and the port lets the low end — and a puff of air — out.',
    after: 'The plate, the wires, the port and the stroke shape the sound before any mic does: a centre stroke for the bass, a corner slap for the snare-like sound.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level; the plate’s flex is a drawn shape, much larger than real.'],
    coupledSubject: 'The cajón cut open',
    coupledNote: 'Ask the player for bass strokes, corner slaps, ghost notes and full patterns before you move a mic — and find the port first.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: the floor, a wall and the player rocking the box all change the low end. The pictures show where the sound comes from and where it leaves.',
    pair: {
      title: 'Centre or corner',
      badge: 'A simplified picture: where the plate moves, not how loud · motion drawn larger',
      looking: 'The box cut open',
      prompt: 'Drag SWING to flex the plate, then switch STROKE. Watch what moves.',
      key: 'STROKE',
      rest: 'the plate at rest',
      cells: ['STROKE', 'THE PLATE', 'YOU HEAR'],
      together: {
        option: 'A CENTRE STROKE',
        blurb: 'Near the middle: the plate bows, the box’s air pumps.',
        short: 'CENTRE',
        title: 'A CENTRE STROKE',
        card: 'Near the middle of the plate: it bows in and out, pumping the air in the box — the low bass tone, much of it out of the port.',
        v0: 'CENTRE',
        v1: 'BOWS',
        air: { plus: 'BASS', minus: 'BASS', rest: 'BASS' },
      },
      opposed: {
        option: 'A CORNER SLAP',
        blurb: 'At a top corner: the top flexes, the wires buzz.',
        short: 'CORNER',
        title: 'A CORNER SLAP',
        card: 'At a top corner: the top of the plate flexes against the wires inside — a sharp, snare-like slap, more from the plate than the port.',
        v0: 'CORNER',
        v1: 'BUZZ',
        air: { plus: 'SLAP', minus: 'SLAP', rest: 'SLAP' },
      },
    },
  },
  setting: {
    kitA11y: 'A small stage from above: the cajón player seated, a singer and an acoustic guitarist beside them, a vocal mic downstage.',
    kitLanding: 'Tap anything around the cajón — or step through ITEM — to see what it means for a cajón mic. There is nothing to answer yet.',
    kitIdle: 'A player sits on the cajón beside a singer and a guitarist; their mics and the monitors share the stage with it.',
    leftHanded: 'Players sit and strike to suit their hands — check this player’s arcs, knees, heels and how they get up.',
    stageA11y: 'The band on a stage, from above: the cajón player, a floor monitor downstage facing back toward them, their own monitor behind them, the audience and the PA.',
    studioA11y: 'The band in a studio room, from above: the cajón, an area mic, the room’s walls, no monitors.',
    stageIdle: 'Two floor monitors: one downstage facing back toward the player, and the player’s own behind them. The PA faces the audience.',
    studioIdle: 'No monitors. A wider mic may carry the whole instrument and the room.',
    before: [
      { title: 'FIND THE PORT', text: 'Front, back or elsewhere — find it on THIS cajón before anything else. Leave any factory port filter as it is.' },
      { title: 'MAP THE PLAYER', text: 'Both hands’ arcs, knees, ankles, heels, any rocking — and the way they sit down, stand up and leave. Stands, booms and cables stay outside all of it.' },
      { title: 'THE SNARES ARE THE PLAYER’S', text: 'No retuning, taping or changing the wires without the player’s agreement. Nothing loose inside the box.' },
    ],
    planTitle: 'Around the cajón',
  },
  placement: {
    workedZone: { rear: 'caj.front.rear', frontport: 'caj.front.frontport' },
    workedAim: 'Face the plate — the starting point counts while the mic faces its middle (or the port) within {tol}°. Distance, height and angle are separate things to try.',
    reveal: 'A front mic toward the middle hears more of the bass strokes; aimed higher or toward a corner, more slap and wire. A port mic hears more low end — and its air. Two different working examples, not an average.',
    typeNotes: { kickDynCard: 'A low-frequency dynamic is one working choice for a cajón; a cardioid condenser another.', portClip: 'Only with a clamp made for cajón ports, and the player’s agreement.' },
    note: 'Clearance comes first: stop the player before moving a real mic — outside both hands, the knees and heels, the rocking box and the way off it. Watch PEAK meters for the strongest bass and slap strokes.',
    learn: {
      intro: 'What you just did, in words. After our research, here is where we suggest you begin: in front of the plate, about 30–40 cm, just below the top edge and angled down at its middle — or a close spot dead centre about 15–18 cm out at a slight angle. Behind, about 20 cm out and offset toward a rear port. Different working examples; starting points, not rules.',
      separate: 'Distance, height and angle are separate variables: change one at a time with the whole pattern. Compare at matched level.',
      clearance: 'Clearance comes first: both hands’ arcs — a flourish can reach farther — the knees, shins and heels, the box rocking back, and the way off the box. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear.',
      tendencies: 'Front: more hand attack and slap. Port: more low end and air. Wider: the whole box and the room — and more spill. All tendencies to check by ear.',
    },
  },
  context: {
    variant: 'rear',
    zone: 'caj.front.rear',
    shield: ['caj.box.rear'],
    facing: 'the plate',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: does one mic in front — or a wider one — carry the whole cajón?',
    studioNote: 'Bring up the front mic first; a second at the port only for a defined bass control need, checked with the first in mono. Switch back to LIVE for the monitor exercise.',
    points: [
      { title: 'ONE MIC FIRST', text: 'A practical front or port mic may be enough. Each open channel adds spill and a chance of feedback — keep only those that help.' },
      { title: 'LOW-END FEEDBACK', text: 'Check low-frequency feedback and the singer’s and guitar’s spill with the whole PA and the monitors on.' },
      { title: 'THE PATTERN’S NULLS', text: 'Cardioid rejects most behind; supercardioid and hypercardioid have rear lobes and side-rear nulls — place the wedge by the real pattern.' },
      { title: 'A PORT CLAMP', text: 'A padded clamp made for the port can clear the stage — if this model suits it and the player agrees.' },
    ],
  },
  twoMic: {
    variant: 'rear',
    A: 'caj.front.rear',
    B: 'caj.back.rear',
    learn: [
      'Front plus port: one mic in front of the plate, one behind at the port. They face opposite ways, and the same stroke reaches them at different times.',
      'Bring each up alone, then together in MONO with bass strokes, slaps and a full pattern. Compare BOTH polarities and move a mic — flipping one channel is a common first thing to try in this setup, not a rule.',
    ],
  },
  facing: 'facing the plate',
  reference: 'plate',
  axis: 'the line to the plate',
});
