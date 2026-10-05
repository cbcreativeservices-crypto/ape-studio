/**
 * C12 CLAVINET — the lesson's own pages (LessonArt.pages) and its LessonArt.
 *
 *   sound    the shared string page (PStringSound): one key and its string
 *            cut open (tangent, anvil, yarn, pickups), the ideal string's
 *            shapes read at the PICKUP (it hears them; it does not drive
 *            them), and "where it leaves" as the SIGNAL PATH — direct, miked,
 *            or both.
 *   setting  the shared stage plan (PStagePlan): the amp behind the
 *            keyboardist, the clavinet and the pedals from above; a stage
 *            (the keyboardist's wedge, the band's monitor, the band, the PA)
 *            or a studio (a DI box, a room mic).
 * Positions on the plan are ILLUSTRATIVE (a typical layout).
 */
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { makeStringSoundPage, type RadiateOption } from '../shared/strings/PStringSound';
import { makeStagePage, type PlanSpot } from '../shared/strings/PStagePlan';
import { ampBox, LAYOUT } from './ampSpec.ts';
import { AmpTop, CLAV_BASE_ART, ClavinetPlan } from './art';
import { ClavinetPath, ClavinetSequence } from './soundArt';

const OPTS: readonly RadiateOption[] = [
  { id: 'mic', label: 'MIC THE AMP', blurb: 'The chain through the speaker.', card: { title: 'THROUGH THE AMP AND A MIC', text: 'Clavinet → pedals → amp → speaker → mic → console. The mic never hears the strings or the pickups: it hears the speaker, turning the signal back into sound — with the amp, the cabinet and the room in it.' } },
  { id: 'post', label: 'DI AFTER PEDALS', blurb: 'A direct signal with the effects.', card: { title: 'DIRECT, AFTER THE PEDALS', text: 'A DI taken after the pedals keeps the effects the player hears, without the amp, the speaker or the room. Label it “post”: it is not interchangeable with a direct signal before the pedals.' } },
  { id: 'pre', label: 'DI BEFORE PEDALS', blurb: 'A clean direct signal.', card: { title: 'DIRECT, BEFORE THE PEDALS', text: 'A DI before the pedals gives the clean clavinet — open to any processing or re-amping later — but it does not document the sound the player was monitoring. Label it “pre”.' } },
  { id: 'both', label: 'DI + MIC', blurb: 'Both paths, kept separate.', card: { title: 'BOTH PATHS, SIDE BY SIDE', text: 'A direct track and the amp mic together: the direct signal’s precision plus the cabinet’s character. The mic’s signal arrives later — align the two in mono before keeping both.' } },
];

const SOUND = makeStringSoundPage({
  seqTitle: 'Key to signal',
  subject: 'One key of the clavinet and its string, cut open: the key, the tangent, the anvil, the yarn, the pickups and the bridge',
  looking: { combo: 'Side view · one key and its string, cut open', cab: 'Side view · one key and its string, cut open' },
  cells: [
    { k: 'KEY', at: ['DOWN', 'DOWN', 'DOWN', 'DOWN', 'UP'], flex: 0.9 },
    { k: 'TANGENT', at: ['RISES', 'ON ANVIL', 'HOLDS', 'HOLDS', 'DROPS'], flex: 1.1 },
    { k: 'STRING', at: ['STILL', 'PRESSED', 'RINGS', 'RINGS', 'MUTED'], flex: 1 },
    { k: 'OUTPUT', at: ['—', '—', 'SIGNAL', 'TO THE AMP', '—'], flex: 1.2 },
  ],
  badge: 'The order of events, not their speed · one string, not to scale · motion drawn much larger · silent',
  reveal: 'The string moves almost no air: the PICKUPS turn its motion into a small voltage, and only a speaker turns that back into sound a mic can hear.',
  after: 'Release the key and the tangent drops: the yarn-wound part of the string, released, mutes it at once — that is why a clavinet sounds so short and percussive.',
  shapes: {
    word: 'PICKUP',
    phrase: 'the pickup',
    role: 'sense',
    points: [
      { id: 'near', label: 'NEAR THE BRIDGE', frac: 0.06, blurb: 'Close to the bridge end, where the clavinet’s pickups sit: it hears almost every shape — a bright, biting signal.' },
      { id: 'tenth', label: 'A TENTH ALONG', frac: 0.1, blurb: 'A little farther along the string.' },
      { id: 'quarter', label: 'A QUARTER ALONG', frac: 0.25, blurb: 'A quarter of the way along — for comparison: shape 4 has a still point here.' },
    ],
    defaultPoint: 'near',
    ends: { left: 'BRIDGE', right: 'ANVIL', tone: 'clav' },
    subject: 'One of the clavinet’s strings',
    notes: [
      'The tangent strikes the string at the very end of its sounding length — at the anvil — so it sets almost every shape going. What reaches the amp depends on where the PICKUP sits: a pickup hears a shape only as much as the string moves under it, and nothing of a shape whose still point it sits on.',
      'The clavinet’s pickups and the switches that choose between them work this way: part of the tone is set here, before any amp or mic. Write the switch settings down with the mic position.',
    ],
  },
  radiate: {
    title: 'Where it leaves',
    key: 'PATH',
    options: () => OPTS,
    defaultOption: () => 'mic',
    Component: ClavinetPath,
    badge: 'A signal path, not a picture of the stage · nothing here plays a sound',
    looking: () => 'The clavinet’s signal path',
    prompt: 'Switch PATH and watch what each capture includes. Which one hears the amp and the room?',
    bezel: (_v, o) => [
      { k: 'CAPTURES', v: o === 'mic' ? 'THE AMP IN AIR' : o === 'post' ? 'WITH EFFECTS' : o === 'pre' ? 'DRY CLAVINET' : 'BOTH', flex: 1.3 },
      { k: 'MIC', v: o === 'mic' || o === 'both' ? 'YES' : 'NONE', flex: 0.7 },
      { k: 'CHECK', v: o === 'mic' ? 'POSITION' : o === 'both' ? 'MONO + TIMING' : 'LABEL PRE/POST', flex: 1.2 },
    ],
  },
  silentNote: 'This lab never plays a sound and draws no frequency curve for the clavinet: how a real one sounds depends on the instrument, its switches, the pedals, the amp, the speaker and the room. The pictures show where the sound is made and where it can be captured.',
});

/* ── the stage plan (frame C from above: u = x toward the audience, v = z) ── */
const NEAR: ViewBox = { u0: -500, u1: 2000, v0: -1700, v1: 500 };
const WIDE: ViewBox = { u0: -1150, u1: 3600, v0: -2000, v1: 2600 };

const SPOTS: PlanSpot[] = [
  { item: 'clav', glyph: 'none', x: (LAYOUT.clav.x0 + LAYOUT.clav.x1) / 2, z: LAYOUT.clav.z0, scene: 'all', r: 420, label: { du: 0, dv: -120 } },
  { item: 'pedals', glyph: 'none', x: LAYOUT.pedals.x, z: LAYOUT.pedals.z + 160, scene: 'near', r: 220, label: { du: -320, dv: 0 } },
  { item: 'wedge.keys', glyph: 'wedge', x: 2100, z: -1400, faces: { x: -1, z: 0 }, scene: 'stage', r: 330, label: { du: 0, dv: 420 } },
  { item: 'wedge.band', glyph: 'wedge', x: -600, z: 1100, faces: { x: 0, z: 1 }, scene: 'stage', r: 330, label: { du: 0, dv: -400 } },
  { item: 'band', glyph: 'band', x: -150, z: 2050, scene: 'stage', r: 450 },
  { item: 'pa', glyph: 'pa', x: 3150, z: -700, faces: { x: 1, z: 0 }, scene: 'stage', r: 380, label: { du: 0, dv: 450 } },
  { item: 'di', glyph: 'none', x: 1100, z: 300, scene: 'studio', r: 240, label: { du: 0, dv: 0 } },
  { item: 'room', glyph: 'stand', x: 1500, z: 900, faces: { x: -1, z: -0.6 }, scene: 'studio', r: 300, label: { du: 0, dv: 380 } },
];

let ringCache: Record<string, ReturnType<typeof Skia.Path.Make>> = {};
function ownRing(v: VariantId) {
  const b = ampBox(v === 'cab' ? 'cab' : 'combo');
  let p = ringCache[b.kind];
  if (!p) {
    p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(b.x0 - 40, b.z0 - 40, b.x1 - b.x0 + 80, b.z1 - b.z0 + 80), 40, 40));
    ringCache = { ...ringCache, [b.kind]: p };
  }
  return p;
}

function OwnPlan({ variant, lit }: { variant: VariantId; lit: boolean }) {
  return (
    <Group>
      <ClavinetPlan dim={0.9} />
      <AmpTop variant={variant} />
      {lit ? <Path path={ownRing(variant)} style="stroke" strokeWidth={22} color="#ffc64d" /> : null}
    </Group>
  );
}

const SETTING = makeStagePage({
  Own: OwnPlan,
  ownItem: 'amp',
  ownHit: (v, u, w) => {
    const b = ampBox(v === 'cab' ? 'cab' : 'combo');
    return u >= b.x0 - 40 && u <= b.x1 + 40 && w >= b.z0 - 40 && w <= b.z1 + 40;
  },
  near: () => NEAR,
  wide: () => WIDE,
  spots: () => SPOTS,
  nearBadge: 'From above · a typical layout · the amp behind the keyboardist, the audience to the right',
  audience: () => ({ text: 'AUDIENCE →', u: 3550, v: 300, align: 'right' }),
  nearLooking: 'Plan · the amp, the clavinet and the keyboardist from above',
  hearing: 'Protect your hearing: an amp turned up for the stage is loud right where a close mic and your ears go, and so are the soundcheck and the monitors. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — it has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.',
});

export const CLAV_ART: LessonArt = {
  ...CLAV_BASE_ART,
  StrikeSequence: ClavinetSequence,
  pages: { sound: SOUND, setting: SETTING },
};
