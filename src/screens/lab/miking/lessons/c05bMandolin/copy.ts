/**
 * C05b MANDOLIN — the pages' words (starting-points voice; no sources,
 * brands or badges).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C05B_BUILT, C05B_SHIELD } from './geometry.ts';

export const MANDO: Noun = { one: 'mandolin', the: 'the mandolin', player: 'mandolin player' };
const g = C05B_BUILT.scenes.a.g;

export const C05B_COPY = stringsCopy({
  n: MANDO,
  subject: { a: 'a standing player with an A-style mandolin', f: 'a standing player with an F-style mandolin' },
  variantKey: 'STYLE',
  variantShort: { a: 'A-style, oval hole', f: 'F-style, f-holes' },
  variantNotes: { f: 'F-STYLE: two f-holes, a carved scroll and points. The body outline and the opening are separate things: name each when you describe a mandolin.' },
  figureLabel: 'Front view of a standing player with a mandolin: a small body with its opening, a floating bridge, eight strings in four pairs over a short neck to the headstock, the tailpiece at the tail end.',
  partsIdle: 'Eight strings, in four pairs, drive a floating bridge; the bridge drives the carved top; the top and the air in the body make the sound — the next page shows how.',
  radiator: 'top',
  strikes: [
    { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 35, blurb: 'About 3.5 cm (1.4 in) from the bridge — the bright, choppy end.' },
    { id: 'body', label: 'OVER THE BODY', mm: 90, blurb: 'Over the body between the bridge and the opening, where most players pick.' },
    { id: 'neck', label: 'NECK END', mm: g.edge, blurb: 'Where the neck meets the body — a rounder pluck.' },
    { id: 'middle', label: 'THE MIDDLE (12TH)', mm: g.L / 2, blurb: 'The exact middle of the open string, over the 12th fret.' },
  ],
  strikeDefault: 'body',
  soundReveal: 'Eight thin strings move very little air on their own: the floating bridge drives the carved TOP, and the top and the air in the small body make the sound.',
  soundAfter: 'Then the strings, the top and the body ring on — briefly, on a small, bright instrument. Players keep a note going by picking it fast and repeatedly: tremolo.',
  shapesNote2: 'This is an ideal string between rigid ends. On a mandolin each note is a PAIR of strings tuned together, and the bridge is a floating one on a carved top.',
  coupledNote: 'The top bows in and out round the bridge and pumps the air through the opening — a simplified picture of the lowest motion. A close mic hears the part of the top, the opening or the strings it faces most.',
  setting: {
    kitA11y: 'The mandolin player from above, standing on a strap, a vocal mic in front of the mouth.',
    kitIdle: 'The space round a mandolin player is theirs: the picking arc over the top, the fretting hand on a short neck, and the instrument turning as they move.',
    leftHanded: 'Left-handed players hold it mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the player with a floor wedge in front, a shared band mic out front, the band upstage, the PA at the front corners.',
    studioA11y: 'A studio room from above: the player on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the band behind, the PA facing out — or a shared band mic the players step in to for solos.',
    studioIdle: 'No monitors on the floor. The room is part of the picture now — a small instrument in a big space.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which mandolin — A-style or F-style, oval hole or f-holes? Chop, tremolo, single-note leads? How do they move and turn? Hear it unamplified, from the front, at their real level.' },
      { title: 'THE INSTRUMENT IS THEIRS', text: 'The floating bridge and the carved top are instrument parts, not mounting hardware. Never move the bridge, insert anything into an opening, or clamp a mic to the scroll or a finish without the owner’s OK.' },
    ],
  },
  workedZone: { a: 'joint.a', f: 'joint.f' },
  workedAim: 'Aim it at the junction of the neck and the body — the lab counts it while the mic’s axis, followed in, meets the mandolin within about 11 cm of {head}. Distance, position and angle are separate things to try.',
  clearWhat: 'the picking arc, the fretting hand, the short neck and the player’s view',
  placementReveal: 'Toward the bridge and top tends to bring chop and upper-register definition; toward the opening, a different body resonance; farther back, the whole instrument and the room. Mandolins differ, so “it depends on this one” is fair too.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin at the neck junction, then move toward the bridge and top, or change the angle — play both chop and sustained notes at the player’s real level.',
    instDynCard: 'Ideas to try with a dynamic: a little closer, aimed at the junction, keeping the boom out of the picking arc.',
    clipCond: 'Ideas to try with a clip-on: check the body’s real depth and the clip’s range first; keep the capsule clear of the pick and hands.',
  },
  learnSeparate: 'Distance, position and angle are separate variables: change one at a time — and record the exact position, because a small move changes a small instrument’s balance. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
  learnTendencies: 'The neck junction is a balance of strings, pick and wood; toward the bridge and top, chop and definition; toward the opening, body resonance; farther back, the room. These are tests, not fixed tone outcomes.',
  context: {
    variant: 'a',
    zone: 'joint.a',
    shield: C05B_SHIELD,
    plan: { u0: -700, u1: 900, v0: -650, v1: 2050 },
    side: { u0: -700, u1: 900, v0: -650, v1: 1150 },
    frontIds: ['voice'],
    looking: 'From above · mic at the neck junction',
    points: [
      { title: 'CLOSE OR SHARED', text: 'A close directional mic gives useful gain when the player keeps a clear working zone. A shared front mic lets players step in for solos — choreography, restrained monitors and a kind room.' },
      { title: 'A CLIP', text: 'A miniature mic on a clip moves with the player: check the body’s real depth and the clip’s range, the finish and the owner’s consent. A clip does not guarantee isolation or a good tone.' },
      { title: 'THE PICKUP', text: 'On a loud stage a correctly installed pickup may give a more controllable main level, with a mic blended as feedback allows. Label the paths; compare each alone and together in mono.' },
      { title: 'MOVEMENT', text: 'A small instrument turns easily. Mark a playing zone, and test the whole performance.' },
    ],
    body: 'With a wedge in front, a pattern’s rejection is a tool to aim — while the boom stays out of the picking arc and the fretting hand.',
    studioId: 'md.ctx.studio',
    studioPrompt: 'A quiet studio, a good room, a solo mandolin: when is an omni worth trying?',
    studioNote: 'With a quiet, favourable room, one accurate omni near the neck junction can present the mandolin naturally; a cardioid gives more isolation when the room intrudes. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    variant: 'a',
    A: 'joint.a',
    B: 'opening.a',
    learn: [
      'A mandolin is physically small: widening it with spaced mics is a deliberate room and timing choice, not an automatic improvement. Keep a reliable one-mic result as the reference.',
      'When two close views go in: solo them, blend in mono at matched levels, and reposition or rebalance when the sum loses body. Check the pair while the player moves.',
    ],
  },
  practice: { prefix: 'md', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: { ...familyWords(MANDO), mountClip: 'Mount: a clip made for this body’s depth — never on the scroll, the bridge or an opening’s edge, and only with the owner’s OK' },
});
