/**
 * C10 HARP — the lesson's own pages (LessonArt.pages) and its LessonArt.
 *
 *   sound    the shared string page (PStringSound): the pluck stepped
 *            through, the ideal string's shapes with the PLUCK point, and
 *            where the sound leaves (the board's face, the holes, the room).
 *   setting  the shared stage plan (PStagePlan): the harp and harpist from
 *            above, the music stand; a stage (wedges, the band, the PA) or a
 *            studio (the room, a spaced pair about 2 m away).
 * Positions on the plan are ILLUSTRATIVE (a typical layout).
 */
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { VariantId } from '../../engine/model/types.ts';
import { makeStringSoundPage, type RadiateOption } from '../shared/strings/PStringSound';
import { makeStagePage } from '../shared/strings/PStagePlan';
import { HARP_AUDIENCE, HARP_NEAR, HARP_ROOM, HARP_WIDE, harpBox, harpCue, harpOwnFoots, harpPlanFoots, harpSpots } from './planModel.ts';
import { HARP_BASE_ART, HarpistPlan, HarpPlan } from './art';
import { HarpPluckSequence, HarpRadiation } from './soundArt';

const isLever = (v: VariantId) => v === 'lever';

const OPTS: readonly RadiateOption[] = [
  { id: 'board', label: 'THE BOARD', blurb: 'From the soundboard’s face.', card: { title: 'FROM THE SOUNDBOARD', text: 'The soundboard sends sound out from its face — through the strings, toward the room in front and the pillar side. A mic in front, looking back at the board, hears this most; close in, only the part of the board it faces.' } },
  { id: 'holes', label: 'THE HOLES', blurb: 'Out of the soundbox’s back.', card: { title: 'OUT OF THE SOUND HOLES', text: 'The air inside the soundbox leaves through the holes in its back — toward the harpist. A mic behind the harp, or a miniature at a hole (with the owner’s agreement), hears this air, with its own colouring.' } },
  { id: 'room', label: 'THE ROOM', blurb: 'Both, blended at a distance.', card: { title: 'THE WHOLE HARP, AT A DISTANCE', text: 'A full harp is a large source: close in, a mic hears one region; around 2–3 m away the board, the holes and the room blend into the whole instrument — the reason a spaced pair stands about 2 m or more away in a good room.' } },
];

const SOUND = makeStringSoundPage({
  seqTitle: 'Pluck to sound',
  subject: 'The harp from the side: one string pulled, released, ringing through the soundboard',
  looking: { pedal: 'Side view · one string of the concert harp', lever: 'Side view · one string of the lever harp' },
  cells: [
    { k: 'FINGER', at: ['PULLS', 'LETS GO', 'AWAY', 'AWAY', 'DAMPS'], flex: 1 },
    { k: 'STRING', at: ['BENT', 'SWINGS', 'SWINGS', 'RINGS', 'STOPPED'], flex: 1.05 },
    { k: 'SOUNDBOARD', at: ['STILL', 'TUGGED', 'MOVES AIR', 'MOVES AIR', 'SETTLES'], flex: 1.3 },
  ],
  badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
  reveal: 'The string moves very little air on its own: it is the SOUNDBOARD, tugged where the string is anchored, that moves the air.',
  after: 'The string rings on until a hand stops it. Damping a string, and changing a pedal or a lever, are part of the performance — and part of what a close mic hears.',
  shapes: {
    word: 'PLUCK',
    phrase: 'the pluck',
    points: [
      { id: 'middle', label: 'THE MIDDLE', frac: 0.5, blurb: 'Halfway along — near where a harpist often plucks, for a round tone.' },
      { id: 'third', label: 'A THIRD ALONG', frac: 1 / 3, blurb: 'A third of the way along the string.' },
      { id: 'end', label: 'NEAR THE BOARD', frac: 0.12, blurb: 'Close to the soundboard — plucked here, a harp string sounds brighter and thinner.' },
    ],
    defaultPoint: 'middle',
    ends: { left: 'NECK', right: 'BOARD', tone: 'harp' },
    subject: 'One of the harp’s strings',
    notes: [
      'A shape is set moving only as much as the string moves at the plucked point in that shape. Plucked in the middle, every even shape (2, 4, 6 …) has a still point there and is left out — a round, hollow tone. Near the soundboard almost every shape joins in, and the tone is brighter.',
      'This is an ideal, flexible string; a real harp string is close to it. Where the harpist plucks is part of the music, not something to fix with a mic.',
    ],
  },
  radiate: {
    title: 'Where it leaves',
    key: 'FROM',
    options: () => OPTS,
    defaultOption: () => 'board',
    Component: HarpRadiation,
    badge: 'Direction only, never an amount · the soundboard radiates every way; the arrows show where most of it goes',
    looking: (v) => (isLever(v) ? 'The lever harp from the side' : 'The concert harp from the side'),
    prompt: 'Switch FROM and watch where the sound leaves. Where would you put a mic to hear the whole harp?',
    bezel: (_v, o) => [
      { k: 'FROM', v: o === 'board' ? 'THE BOARD' : o === 'holes' ? 'THE HOLES' : 'BOTH', flex: 1 },
      { k: 'TOWARD', v: o === 'board' ? 'THE FRONT' : o === 'holes' ? 'THE HARPIST' : 'THE ROOM', flex: 1.1 },
      { k: 'BLENDS', v: o === 'room' ? '≈ 2–3 M' : 'CLOSE: PART', flex: 1 },
    ],
  },
  silentNote: 'This lab never plays a sound and draws no frequency curve for the harp: how a real harp sounds depends on the instrument, the harpist, the room and the music. The pictures show where the sound comes from and where it leaves.',
});

/* ── the stage plan (frame H from above: u = x toward the audience, v = z the
 *  harpist's right). The layout is pure (planModel.ts): the overlap test
 *  reads the same numbers. ── */

const ringCache = new Map<string, ReturnType<typeof Skia.Path.Make>>();
function ownRing(v: VariantId) {
  const key = isLever(v) ? 'lever' : 'pedal';
  let p = ringCache.get(key);
  if (!p) {
    const b = harpBox(v, 40);
    p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(b.u0, b.v0, b.u1 - b.u0, b.v1 - b.v0), 60, 60));
    ringCache.set(key, p);
  }
  return p;
}

function OwnPlan({ variant, lit }: { variant: VariantId; lit: boolean }) {
  return (
    <Group>
      <HarpistPlan dim={0.85} />
      <HarpPlan variant={variant} />
      {lit ? <Path path={ownRing(variant)} style="stroke" strokeWidth={22} color="#ffc64d" /> : null}
    </Group>
  );
}

const SETTING = makeStagePage({
  Own: OwnPlan,
  ownItem: 'harp',
  ownHit: (v, u, w) => {
    const b = harpBox(v, 40);
    return u >= b.u0 && u <= b.u1 && w >= b.v0 && w <= b.v1;
  },
  near: HARP_NEAR,
  wide: () => HARP_WIDE,
  spots: harpSpots,
  foots: harpPlanFoots,
  cue: harpCue,
  room: () => HARP_ROOM,
  named: (v, item) => (item === 'chair' ? harpOwnFoots(v).find((f) => f.id === 'harpist') ?? null : null),
  nearBadge: 'From above · a typical layout · the harpist at the left, the audience to the right',
  audience: () => HARP_AUDIENCE,
  nearLooking: 'Plan · the harp and the harpist from above',
  hearing: 'Protect your hearing: the harp itself is gentle, but the band or orchestra around it, and the monitors at soundcheck, are loud. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — it has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.',
});

export const HARP_ART: LessonArt = {
  ...HARP_BASE_ART,
  StrikeSequence: HarpPluckSequence,
  pages: { sound: SOUND, setting: SETTING },
};
