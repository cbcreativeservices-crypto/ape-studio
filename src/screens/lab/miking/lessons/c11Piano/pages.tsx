/**
 * C11 PIANO — the lesson's own pages (LessonArt.pages) and its LessonArt.
 *
 *   sound    the shared string page (PStringSound): one note's action cut
 *            open, the ideal string's shapes with the HAMMER point, and where
 *            the sound leaves (the grand cut across with its lid, or the
 *            upright with its wall).
 *   setting  the shared stage plan (PStagePlan): the piano and pianist from
 *            above, a singer, the music; a stage (wedges, a side-fill, the
 *            band, the PA) or a studio (the room, an outside pair).
 * Positions on the plan are ILLUSTRATIVE (a typical layout).
 */
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { makeStringSoundPage, type RadiateOption } from '../shared/strings/PStringSound';
import { makeStagePage, type PlanSpot } from '../shared/strings/PStagePlan';
import { GrandPlan, Pianist, UprightPlan } from '../shared/piano/PianoArt';
import { GB, GS, SETUP, UP, type PianoVariant } from './model.ts';
import { PIANIST_AT } from './geometry.ts';
import { PIANO_BASE_ART } from './art';
import { PianoStrikeSequence } from './soundArt';
import { PianoRadiation } from './radiateArt';

const setupOf = (v: VariantId) => SETUP[(v as PianoVariant) in SETUP ? (v as PianoVariant) : 'grand'];
const isGrand = (v: VariantId) => setupOf(v).kind === 'grand';

const GRAND_OPTS: readonly RadiateOption[] = [
  { id: 'full', label: 'FULL STICK', blurb: 'The lid propped high.', card: { title: 'LID ON THE FULL STICK', text: 'The soundboard sends sound up and down. Off the raised lid’s underside, much of the upward sound is thrown out over the curved side — usually toward the audience — and some leaves under the piano. An outside pair in the curve sits in that thrown sound.' } },
  { id: 'short', label: 'SHORT STICK', blurb: 'The lid propped low.', card: { title: 'LID ON THE SHORT STICK', text: 'A lower lid throws less sound out over the curve and keeps more of it in the case: more separation on a loud stage, a closer, more percussive sound — and little room under the lid for a mic.' } },
  { id: 'closed', label: 'CLOSED', blurb: 'The lid down on the rim.', card: { title: 'LID CLOSED', text: 'Closed, the lid keeps most of the upward sound in; some escapes at the edges and under the piano. Mics then go inside, low-profile and approved by the owner — magnets on the frame, a boundary mic under the lid.' } },
  { id: 'off', label: 'LID OFF', blurb: 'The lid removed by the owner.', card: { title: 'LID OFF', text: 'With the lid off, the soundboard’s upward sound goes up and spreads, with no lid throwing it toward the curved side. Mics over the strings have the most room.' } },
];
const UP_OPTS: readonly RadiateOption[] = [
  { id: 'open', label: 'TOP OPEN · OUT', blurb: 'Pulled 40 cm from the wall, top open.', card: { title: 'PULLED OUT, TOP OPEN', text: 'Much of an upright’s sound leaves at the back, from its soundboard, and bounces off the wall behind; some goes up through the open top. Pulled out from the wall, there is room for a mic behind — and the wall still shapes what it hears.' } },
  { id: 'wall', label: 'AGAINST THE WALL', blurb: 'Pushed back to the wall.', card: { title: 'PUSHED AGAINST THE WALL', text: 'Pressed to the wall, the back has no usable space for a mic, and the sound leaving the soundboard meets the wall at once. Don’t expect a rear position to work there.' } },
  { id: 'closed', label: 'TOP CLOSED', blurb: 'The top lid down.', card: { title: 'TOP CLOSED', text: 'With the top closed, less sound goes up; more of it leaves at the back. The top positions lose most of their view.' } },
];

const SOUND = makeStringSoundPage({
  seqTitle: 'Key to sound',
  subject: 'One note of the piano, cut open: the key, the hammer, the string, the damper, the bridge and the soundboard',
  looking: { grand: 'Side view · one note of the grand, cut open', short: 'Side view · one note of the grand, cut open', baby: 'Side view · one note, cut open', upright: 'Side view · one note of the upright, cut open', uprightFront: 'Side view · one note of the upright, cut open' },
  cells: [
    { k: 'KEY', at: ['DOWN', 'DOWN', 'DOWN', 'DOWN', 'UP'], flex: 0.9 },
    { k: 'HAMMER', at: ['RISING', 'STRIKES', 'FALLEN BACK', 'FALLEN BACK', 'AT REST'], flex: 1.2 },
    { k: 'DAMPER', at: ['LIFTED', 'LIFTED', 'LIFTED', 'LIFTED', 'ON STRINGS'], flex: 1.15 },
  ],
  badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
  reveal: 'The hammer only strikes and falls back — it is the DAMPER, falling back onto the strings when the key comes up, that stops the note.',
  after: 'Hold the key and the strings keep ringing as they slowly fade; release it and the damper stops them. The sustain pedal lifts every damper at once, so whole chords keep ringing.',
  shapes: {
    word: 'HAMMER',
    phrase: 'the hammer',
    points: [
      { id: 'near', label: 'NEAR ONE END', frac: 0.125, blurb: 'An eighth of the way along — near one end, as a piano’s hammers strike (the exact point varies along the keyboard).' },
      { id: 'quarter', label: 'A QUARTER ALONG', frac: 0.25, blurb: 'A quarter of the way along the string.' },
      { id: 'middle', label: 'THE MIDDLE', frac: 0.5, blurb: 'Exactly halfway — for comparison: a piano is not struck here.' },
    ],
    defaultPoint: 'near',
    ends: { left: 'AGRAFFE', right: 'BRIDGE', tone: 'piano' },
    subject: 'One of the piano’s strings',
    notes: [
      'A shape is set moving only as much as the string moves at the struck point in that shape. Struck in the middle, every even shape (2, 4, 6 …) has a still point there and is not driven at all. Near one end — where a piano’s hammers strike — almost every shape joins in.',
      'This is an ideal, flexible string. A real piano string is stiff, so its upper shapes run a little sharp of the whole numbers — part of a piano’s character, and one reason no two pianos sound alike.',
    ],
  },
  radiate: {
    title: 'Where it leaves',
    key: 'LID',
    options: (v) => (isGrand(v) ? GRAND_OPTS : UP_OPTS),
    defaultOption: (v) => (isGrand(v) ? (setupOf(v) as { lid: string }).lid : 'open'),
    Component: PianoRadiation,
    badge: 'Direction only, never an amount · the soundboard radiates every way; the arrows show where most of it goes',
    looking: (v) => (isGrand(v) ? 'The grand cut across, seen from the keyboard' : 'The upright from the side, with the wall behind'),
    prompt: 'Switch LID (or the wall, on an upright) and watch where the sound goes. Where would you put a mic to hear the whole instrument?',
    bezel: (v, o) =>
      isGrand(v)
        ? [
            { k: 'LID', v: o === 'full' ? 'FULL' : o === 'short' ? 'SHORT' : o === 'closed' ? 'CLOSED' : 'OFF', flex: 0.9 },
            { k: 'THROWN TO', v: o === 'full' ? 'CURVED SIDE' : o === 'short' ? 'LESS OUT' : o === 'closed' ? 'KEPT IN' : 'UPWARD', flex: 1.3 },
            { k: 'ALSO', v: 'UNDERNEATH', flex: 1.1 },
          ]
        : [
            { k: 'BACK', v: o === 'wall' ? 'AT THE WALL' : 'TO THE WALL', flex: 1.2 },
            { k: 'TOP', v: o === 'closed' ? 'CLOSED' : 'OPEN', flex: 0.9 },
            { k: 'ROOM BEHIND', v: o === 'wall' ? 'NONE' : '≈ 40 cm', flex: 1.1 },
          ],
  },
  silentNote: 'This lab never plays a sound and draws no frequency curve for the piano: how a real piano sounds depends on the instrument, its regulation and voicing, the room, the pianist and the music. The pictures show where the sound comes from and where it leaves.',
});

/* ── the stage plan ── */
const grandNear = (g: typeof GB): ViewBox => ({ u0: -1250, u1: g.xTail + 900, v0: -1100, v1: 1600 });
const grandWide = (g: typeof GB): ViewBox => ({ u0: -1700, u1: g.xTail + 2400, v0: -1900, v1: 2900 });
const UP_NEAR: ViewBox = { u0: -1500, u1: 1100, v0: -1300, v1: 1400 };
const UP_WIDE: ViewBox = { u0: -2100, u1: 2600, v0: -2000, v1: 2700 };

function grandSpots(g: typeof GB): PlanSpot[] {
  return [
    { item: 'bench', glyph: 'none', x: PIANIST_AT.grand.xKey - 450, z: 0, scene: 'all', r: 330, label: { du: 0, dv: 470 } },
    { item: 'desk', glyph: 'none', x: g.desk.x0 + 40, z: 0, scene: 'near', r: 190, label: { du: 0, dv: -560 } },
    { item: 'singer', glyph: 'singer', x: -150, z: g.hw + 480, faces: { x: -1, z: 0 }, scene: 'near', r: 300, label: { du: 420, dv: 0 } },
    { item: 'wedge.pianist', glyph: 'wedge', x: -700, z: -1100, faces: { x: 0.2, z: 1 }, scene: 'stage', r: 330, label: { du: 0, dv: -400 } },
    { item: 'fill.side', glyph: 'pa', x: 600, z: 2200, faces: { x: 0, z: -1 }, scene: 'stage', r: 360 },
    { item: 'band', glyph: 'band', x: g.xTail + 1300, z: -800, scene: 'stage', r: 900 },
    { item: 'pa', glyph: 'pa', x: g.xTail + 1900, z: 2300, faces: { x: 1, z: 0 }, scene: 'stage', r: 380 },
    { item: 'pair', glyph: 'pair', x: g.curve.p.x + 800 * g.curve.n.x, z: g.curve.p.z + 800 * g.curve.n.z, faces: { x: -g.curve.n.x, z: -g.curve.n.z }, scene: 'studio', r: 300 },
    { item: 'room', glyph: 'none', x: g.xTail + 2200, z: -1700, scene: 'studio', r: 500, label: { du: 0, dv: 0 } },
  ];
}
function uprightSpots(): PlanSpot[] {
  return [
    { item: 'bench', glyph: 'none', x: PIANIST_AT.upright.xKey - 450, z: 0, scene: 'all', r: 330, label: { du: 0, dv: 470 } },
    { item: 'desk', glyph: 'none', x: UP.panel.x - 40, z: 0, scene: 'near', r: 160, label: { du: 0, dv: -560 } },
    { item: 'singer', glyph: 'singer', x: -700, z: UP.hw + 600, faces: { x: 0, z: -1 }, scene: 'near', r: 300 },
    { item: 'wedge.pianist', glyph: 'wedge', x: -1300, z: -900, faces: { x: 0.4, z: 1 }, scene: 'stage', r: 330 },
    { item: 'fill.side', glyph: 'pa', x: -400, z: 2000, faces: { x: 0, z: -1 }, scene: 'stage', r: 360 },
    { item: 'band', glyph: 'band', x: 1300, z: -1300, scene: 'stage', r: 800 },
    { item: 'pa', glyph: 'pa', x: -1700, z: 2200, faces: { x: -1, z: 0 }, scene: 'stage', r: 380 },
    { item: 'pair', glyph: 'pair', x: 260, z: 0, faces: { x: -1, z: 0 }, scene: 'studio', r: 260 },
    { item: 'room', glyph: 'none', x: 2200, z: 2200, scene: 'studio', r: 500, label: { du: 0, dv: 0 } },
  ];
}

const ringCache = new Map<string, ReturnType<typeof Skia.Path.Make>>();
function ownRing(v: VariantId) {
  const s = setupOf(v);
  const key = s.kind === 'grand' ? s.id : 'up';
  let p = ringCache.get(key);
  if (!p) {
    p = Skia.Path.Make();
    if (s.kind === 'grand') {
      const g = s.id === 'S' ? GS : GB;
      g.outline.forEach(([x, z], i) => (i === 0 ? p!.moveTo(x, z) : p!.lineTo(x, z)));
      p.close();
    } else {
      p.addRect(Skia.XYWHRect(UP.xKey, -UP.hw, UP.xBack - UP.xKey, UP.hw * 2));
    }
    ringCache.set(key, p);
  }
  return p;
}

function OwnPlan({ variant, lit }: { variant: VariantId; lit: boolean }) {
  const s = setupOf(variant);
  return (
    <Group>
      {s.kind === 'grand' ? (
        <>
          <Pianist view="top" xKey={PIANIST_AT.grand.xKey} pedalX={PIANIST_AT.grand.pedalX} dim={0.85} />
          <GrandPlan id={s.id} lid={s.lid} />
        </>
      ) : (
        <>
          <Pianist view="top" xKey={PIANIST_AT.upright.xKey} pedalX={PIANIST_AT.upright.pedalX} dim={0.85} />
          <UprightPlan />
        </>
      )}
      {lit ? <Path path={ownRing(variant)} style="stroke" strokeWidth={22} color="#ffc64d" /> : null}
    </Group>
  );
}

const SETTING = makeStagePage({
  Own: OwnPlan,
  ownItem: 'piano',
  ownHit: (v, u, w) => {
    const s = setupOf(v);
    if (s.kind === 'grand') {
      const g = s.id === 'S' ? GS : GB;
      return u >= g.xKey && u <= g.xTail && w >= -g.hw && w <= g.hw && (u < g.xs || w <= g.bentZ(u));
    }
    return u >= UP.xKey && u <= UP.xBack && Math.abs(w) <= UP.hw;
  },
  near: (v) => (isGrand(v) ? grandNear(setupOf(v).kind === 'grand' && (setupOf(v) as { id: string }).id === 'S' ? GS : GB) : UP_NEAR),
  wide: (v) => (isGrand(v) ? grandWide(setupOf(v).kind === 'grand' && (setupOf(v) as { id: string }).id === 'S' ? GS : GB) : UP_WIDE),
  spots: (v) => (isGrand(v) ? grandSpots((setupOf(v) as { id: string }).id === 'S' ? GS : GB) : uprightSpots()),
  nearBadge: 'From above · a typical layout · the pianist at the left, the treble side toward the bottom',
  audience: (v) => (isGrand(v) ? { text: 'AUDIENCE ↓ (THE CURVED SIDE)', u: 300, v: 2750, align: 'center' } : { text: 'AUDIENCE ↓', u: -300, v: 2550, align: 'center' }),
  nearLooking: 'Plan · the piano and the pianist from above',
  hearing: 'Protect your hearing during soundcheck and repeated loud passages: close to the hammers a piano can pass 130 dB. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — it has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.',
});

export const PIANO_ART: LessonArt = {
  ...PIANO_BASE_ART,
  StrikeSequence: PianoStrikeSequence,
  pages: { sound: SOUND, setting: SETTING },
};
