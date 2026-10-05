/**
 * C05c UKULELE — the pages' words (starting-points voice; no sources,
 * brands or badges).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C05C_BUILT, C05C_SHIELD } from './geometry.ts';

export const UKE: Noun = { one: 'ukulele', the: 'the ukulele', player: 'player' };
const g = C05C_BUILT.scenes.soprano.g;

export const C05C_COPY = stringsCopy({
  n: UKE,
  subject: { soprano: 'a seated player with a soprano ukulele' },
  variantKey: 'SIZE',
  variantShort: { soprano: 'soprano ukulele' },
  figureLabel: 'Front view of a seated player with a soprano ukulele: a small figure-of-eight body with a round sound hole, a tie bridge, four nylon strings over a short neck to a small headstock, the strumming hand over the body.',
  partsIdle: 'Four nylon strings drive the bridge; the bridge drives the small top; the top and the air in the body make the sound — the next page shows how.',
  radiator: 'top',
  strikes: [
    { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 30, blurb: 'About 3 cm (1.2 in) from the saddle — the bright end.' },
    { id: 'hole', label: 'OVER THE HOLE', mm: g.hole.x, blurb: 'Over the sound hole.' },
    { id: 'neck', label: 'NECK END', mm: g.edge, blurb: 'Where the neck meets the body — here, the exact middle of the open string.' },
  ],
  strikeDefault: 'hole',
  strikerPhrase: 'finger',
  striker: 'FINGER',
  soundReveal: 'Four soft nylon strings move very little air: the bridge drives the small TOP, and the top and the air in the little body make the sound.',
  soundAfter: 'Then the strings, the top and the small body ring on briefly — the BODY of the sound. A small body radiates the lowest notes less strongly; check them anyway.',
  shapesNote2: 'This is an ideal string between rigid ends. On this soprano the neck meets the body at the 12th fret — the exact middle of the open string — so a strum there leaves the even shapes still.',
  coupledNote: 'The top bows in and out round the bridge and pumps the air through the sound hole — a simplified picture of the lowest motion. The sound hole is not the whole instrument.',
  setting: {
    kitA11y: 'The player from above, seated with the ukulele: the chair behind, a vocal mic in front of the mouth, a DI box on the floor.',
    kitIdle: 'The space round a ukulele player is theirs: the strumming arc over a small body, the fretting hand on a short neck — and often their voice, right above.',
    leftHanded: 'Left-handed players hold it mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the player with a floor wedge in front, the band upstage, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the player on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the band behind, the PA facing out: a small, quiet instrument against a loud stage — the pickup may carry it.',
    studioIdle: 'No monitors on the floor. The room is part of the picture now; a broad position can show a small body well.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Fingertips or a pick? Strummed rhythm or a picked melody? Do they sing, use a strap, move? Which size — soprano, concert, tenor or baritone? Hear it unamplified, from the front. Sizes and tunings differ: do not assume they behave alike.' },
      { title: 'NOTHING ON OR IN IT', text: 'Never press a mic against the ukulele, insert one into the sound hole, or attach a clip to an unsuitable finish. Check the body’s real depth against a clip’s range, and ask the owner.' },
    ],
  },
  workedZone: { soprano: 'upper.soprano' },
  workedAim: 'Aim it at the upper body and the neck joint — the lab counts it while the mic’s axis, followed in, meets the ukulele within about 9 cm of {head} — a little off the sound hole’s axis.',
  clearWhat: 'the strumming arc, the fretting hand, the vocal mic and the player’s view',
  placementReveal: 'Toward the hole tends to bring more body and low-mid — and a single resonance close in; toward the neck, more string definition. Ukuleles differ, so “it depends on this one” is fair too.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin at the upper body, then compare toward the bridge and top, toward (not into) the hole, and a little farther back — soft and strong strums each time.',
    instDynCard: 'Ideas to try with a dynamic: a little closer, off the strumming arc; watch the proximity bass.',
    clipCond: 'Ideas to try with a clip-on: measure the body’s depth first; the clip’s range must fit it. It holds its place as the player moves, but not always the tone.',
  },
  learnSeparate: 'Distance, position and angle are separate variables: change one at a time. The neck joins a soprano at a different place from a baritone — use the actual instrument, not a memorised guitar fret. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
  learnTendencies: 'The upper body and neck joint is a balanced first experiment, borrowed from the guitar; toward the bridge, strum attack; toward the hole, body; farther back, the whole instrument and the room. These are questions to audition, not labels.',
  context: {
    zone: 'upper.soprano',
    shield: C05C_SHIELD,
    plan: { u0: -700, u1: 800, v0: -600, v1: 1650 },
    side: { u0: -700, u1: 800, v0: -600, v1: 720 },
    frontIds: ['voice'],
    looking: 'From above · mic at the upper body',
    points: [
      { title: 'A SINGING PLAYER', text: 'The voice is right above the ukulele: spill between the two mics is expected. Decide whether a combined performance or separate control matters more before chasing isolation.' },
      { title: 'A CLIP', text: 'A miniature mic on a clip keeps its distance as the player moves — check the body’s depth against the clip’s range, the finish and the owner’s consent.' },
      { title: 'THE PICKUP', text: 'An installed pickup can carry a more controllable signal on a loud stage. It is an electrical path and sounds different from a mic; compare each alone and in mono.' },
      { title: 'MOVEMENT', text: 'Mark a comfortable playing zone, and keep the boom clear of the strumming hand, the vocal mic and the player’s way on and off.' },
    ],
    body: 'With a wedge in front, aim the rejection by the actual pattern — a supercardioid still hears a little from its rear lobe. If feedback starts, lower the offending level and change the geometry before chasing EQ notches.',
    studioId: 'uk.ctx.studio',
    studioPrompt: 'A quiet, intimate solo in a good room: what could one mic do here?',
    studioNote: 'In a quiet, good room one omni or a well-placed directional mic can present the ukulele naturally; a broad position often shows a small body better than two very close spots. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    A: 'upper.soprano',
    B: 'hole.soprano',
    learn: [
      'A small instrument does not need a wide stereo image. Establish a dependable mono mic first; add a second only for a stated purpose, and check the pair through the whole performance.',
      'With a second mic on another local area, solo each path and blend at useful levels in mono; reposition and rebalance if the sum thins. A polarity switch is a test, not a cure.',
    ],
  },
  practice: { prefix: 'uk', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: { ...familyWords(UKE), mountClip: 'Mount: a clip whose range fits this body’s measured depth — only with the owner’s OK, and never on an unsuitable finish' },
});
