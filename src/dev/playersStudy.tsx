/**
 * DEV STUDY — THE PLAYERS (figure V2, wave 3 sets 3b–3d of D78, 2026-11-24):
 * each converted lesson's player, the current look beside the new, at about
 * the lesson's phone size and enlarged about 3×, side view and from above.
 * Dev page: `#labpreview/FigureStudy/players` (one set: `/players3b`, …).
 * The pictures are the lessons' own art (the `v2` switch only).
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Circle, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { TimpaniArt } from '../screens/lab/miking/lessons/m06Timpani/art';
import { ConcertBassDrumArt } from '../screens/lab/miking/lessons/m07aConcertBassDrum/art';
import { BASS_ARM, BASS_FULCRUM } from '../screens/lab/miking/lessons/m07aConcertBassDrum/playerV2';
import { TIMP_STICKS } from '../screens/lab/miking/lessons/m06Timpani/timpanistV2';
import { TIMP_MALLETS } from '../screens/lab/miking/lessons/m06Timpani/malletPose';
import { KitSide, KitTop } from '../screens/lab/miking/lessons/shared/kitScene/KitSceneArt';
import { CajonArt } from '../screens/lab/miking/lessons/i02Cajon/art';
import { stateOf as cajState } from '../screens/lab/miking/lessons/i02Cajon/model';
import { FootstepsArt } from '../screens/lab/miking/lessons/f01Footsteps/art';
import { PerspectiveArt } from '../screens/lab/miking/lessons/f05Perspective/art';
import { PropsArt } from '../screens/lab/miking/lessons/f03Props/art';
import { ImpactsArt } from '../screens/lab/miking/lessons/f04Impacts/art';
import { PianoArt } from '../screens/lab/miking/lessons/c11Piano/art';
import { HarpArt } from '../screens/lab/miking/lessons/c10Harp/art';
import { E07Instrument } from '../screens/lab/miking/lessons/e07SingerInstrument/art';
import { V_GUITAR, V_PIANO } from '../screens/lab/miking/lessons/e07SingerInstrument/geometry';
import { WurliSection } from '../screens/lab/miking/lessons/shared/keys/KeysArt';
import { W as WURLI_W } from '../screens/lab/miking/lessons/shared/keys/wurliModel';
import { harpHands } from '../screens/lab/miking/lessons/c10Harp/harpistPose';
import { PIANIST_AT } from '../screens/lab/miking/lessons/c11Piano/geometry';
import { FLOOR_Y as PIANO_FLOOR, KEY_TOP_Y } from '../screens/lab/miking/lessons/shared/piano/pianoSpec';

const STAGE = '#0b0c10';
const INK = '#e8e6e1';
const DIM = '#9a978f';

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

/** One lesson in ONE canvas (the browser allows only so many): old | new at the phone's size (side, from
 *  above), then the new enlarged and the close-ups, each picture cropped to its box. */
function Lesson({ width, title, note, side, top, sideBox, topBox, zoomSide, zoomTop, more = [] }: {
  width: number;
  title: string;
  note?: string;
  side: (v2: boolean, hands?: boolean) => ReactNode;
  top: (v2: boolean) => ReactNode;
  sideBox: [number, number, number, number];
  topBox: [number, number, number, number];
  zoomSide: [number, number, number, number];
  zoomTop: [number, number, number, number];
  /** further close-ups (the hands, a foot …) */
  more?: { title: string; view: 'side' | 'top'; box: [number, number, number, number]; wide?: boolean; /** a picture made to show the hands */ hands?: boolean }[];
}) {
  const gap = 8;
  const lab = 16;
  const small = Math.floor(Math.min(300, (width - 24 - gap) / 2));
  const big = Math.floor(Math.min(2 * small + gap, width - 24));
  type Item = { title: string; draw: ReactNode; b: [number, number, number, number]; w: number; x: number; y: number; h: number };
  const items: Item[] = [];
  let y = 0;
  const row = (cells: { title: string; draw: ReactNode; b: [number, number, number, number] }[], w: number) => {
    const h = Math.max(...cells.map((c) => (c.b[3] * w) / c.b[2]));
    cells.forEach((c, i) => items.push({ ...c, w, x: i * (w + gap), y, h }));
    y += h + lab + gap;
  };
  row([{ title: 'SIDE · CURRENT', draw: side(false), b: sideBox }, { title: 'SIDE · NEW', draw: side(true), b: sideBox }], small);
  row([{ title: 'ABOVE · CURRENT', draw: top(false), b: topBox }, { title: 'ABOVE · NEW', draw: top(true), b: topBox }], small);
  row([{ title: 'SIDE · NEW, ENLARGED', draw: side(true), b: zoomSide }, { title: 'ABOVE · NEW, ENLARGED', draw: top(true), b: zoomTop }], small);
  const pairs = more.filter((m) => !m.wide);
  for (let i = 0; i < pairs.length; i += 2) row(pairs.slice(i, i + 2).map((m) => ({ title: m.title, draw: m.view === 'side' ? side(true, m.hands) : top(true), b: m.box })), small);
  // (a close-up across the whole width: the hands checked at about 10×)
  for (const m of more.filter((q) => q.wide)) row([{ title: m.title, draw: m.view === 'side' ? side(true, m.hands) : top(true), b: m.box }], big);
  const W = big;
  const H = y;
  return (
    <View style={{ marginBottom: 24 }}>
      <Head title={title} note={note} />
      <View>
        <Canvas style={{ width: W, height: H }}>
          {items.map((q, i) => {
            const k = q.w / q.b[2];
            return (
              <Group key={i} clip={Skia.XYWHRect(q.x, q.y, q.w, q.h)}>
                <Rect x={q.x} y={q.y} width={q.w} height={q.h} color={STAGE} />
                <Group transform={[{ translateX: q.x + q.w / 2 - q.b[0] * k }, { translateY: q.y + q.h / 2 - q.b[1] * k }, { scale: k }]}>
                  <FigureScale ptPerMm={k}>{q.draw}</FigureScale>
                </Group>
              </Group>
            );
          })}
        </Canvas>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} pointerEvents="none">
          {items.map((q, i) => (
            <Text key={i} style={{ position: 'absolute', left: q.x, top: q.y + q.h + 1, color: DIM, fontSize: 11, width: q.w }}>
              {q.title} · {(q.w / q.b[2]).toFixed(2)} pt/mm
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Set 3b, the Foley performers (one page per lesson: the browser runs out of canvases). */
function Foley({ width, only }: { width: number; only: string }) {
  const L = (id: string, title: string, note: string, Art: (p: { view: 'side' | 'top'; variant: string; v2?: boolean }) => ReactNode, variant: string, sideBox: [number, number, number, number], topBox: [number, number, number, number], zoomSide: [number, number, number, number], zoomTop: [number, number, number, number], more: { title: string; view: 'side' | 'top'; box: [number, number, number, number]; wide?: boolean }[] = []) =>
    only === id ? <Lesson key={id} width={width} title={title} note={note} side={(v2) => <Art view="side" variant={variant} v2={v2} />} top={(v2) => <Art view="top" variant={variant} v2={v2} />} sideBox={sideBox} topBox={topBox} zoomSide={zoomSide} zoomTop={zoomTop} more={more} /> : null;
  return (
    <View>
      {L('players-fm06', 'M06 Timpani — the two fists (fix round)', 'The far (left) fist behind the near one: each its own mallet, a soft shadow of the near hand on the far one.', TimpaniArt as never, 'two', [-200, -900, 2300, 2100], [-150, -100, 2300, 2000], [-560, -960, 300, 260], [-560, -380, 320, 420], [{ title: 'SIDE · THE FISTS, ABOUT 12×', view: 'side', box: [-540, -960, 160, 140] }])}
      {L('players-f01', 'F01 Footsteps — the walker (Mei)', 'Mid-stride: the near foot forward at the heel strike, toe a little up; the far foot behind on its ball, heel lifting; the arms swinging empty, the back of each hand to the camera.', FootstepsArt as never, 'tile', [0, -760, 2200, 2400], [0, 0, 2200, 1800], [-60, -1250, 700, 900], [-40, 0, 900, 800], [{ title: 'SIDE · THE FEET, ABOUT 6×', view: 'side', box: [-30, -80, 700, 300] }, { title: 'SIDE · THE NEAR HAND, ABOUT 6×', view: 'side', box: [-200, -850, 300, 300] }])}
      {L('players-f03-paper', 'F03 Props — paper (Mei)', 'Both hands palm down on the sheet on the table, bending it.', PropsArt as never, 'paper', [-300, -400, 2000, 2000], [-200, 0, 1600, 1400], [-250, -350, 700, 800], [-250, 0, 800, 700], [{ title: 'SIDE · THE HANDS ON THE SHEET, ABOUT 6×', view: 'side', box: [-120, -40, 300, 220] }, { title: 'ABOVE · THE HANDS ON THE SHEET, ABOUT 6×', view: 'top', box: [-120, 0, 320, 400] }])}
      {L('players-f03-door', 'F03 Props — the door (Mei)', 'The right hand closed on the outer end of the handle (a bar through the door, square to it), thumb on top; the left at the side.', PropsArt as never, 'door', [-200, -600, 2000, 2400], [-200, 300, 1800, 1800], [-250, -250, 700, 800], [-250, 0, 800, 700], [{ title: 'SIDE · THE HAND ON THE LEVER, ABOUT 6×', view: 'side', box: [-60, 0, 260, 260] }, { title: 'ABOVE · THE HAND ON THE LEVER, ABOUT 6×', view: 'top', box: [-80, 60, 320, 320] }])}
      {L('players-f03-chair', 'F03 Props — the chair (Mei)', 'Both hands round the top of the chair’s back, ready to lift and drag it.', PropsArt as never, 'chair', [-500, -900, 2000, 2200], [-500, -200, 1800, 1600], [-600, -1150, 700, 800], [-550, -200, 800, 700], [{ title: 'SIDE · THE HANDS ON THE BACK, ABOUT 6×', view: 'side', box: [-440, -880, 260, 260] }, { title: 'ABOVE · THE HANDS ON THE BACK, ABOUT 6×', view: 'top', box: [-430, -210, 300, 420] }])}
      {L('players-f03-keys', 'F03 Props — keys (Mei)', 'As F05: the key ring in a loose right fist, the keys hanging below.', PropsArt as never, 'keys', [-200, -480, 2000, 2000], [-200, 0, 1600, 1400], [-200, -320, 700, 800], [-200, 0, 800, 700])}
      {L('players-f04-impact', 'F04 Impacts — the padded block (Mei)', 'The block held by its back end in the right fist, raised to strike the table; the left hand flat on the table.', ImpactsArt as never, 'impact', [-300, -500, 2000, 2000], [-200, 0, 1800, 1600], [-250, -350, 700, 800], [-250, 0, 800, 700], [{ title: 'SIDE · THE BLOCK IN THE HAND, ABOUT 6×', view: 'side', box: [-60, -230, 300, 260] }, { title: 'SIDE · THE LEFT HAND ON THE TABLE, ABOUT 6×', view: 'side', box: [-300, -40, 300, 220] }])}
      {L('players-f04-water', 'F04 Impacts — the pour (Mei)', 'The jug’s handle in the right fist, the jug tipped to pour; the left hand palm down beside it, steadying.', ImpactsArt as never, 'water', [-300, -500, 2000, 2000], [-200, 0, 1800, 1600], [-300, -450, 700, 800], [-250, 0, 800, 700], [{ title: 'SIDE · THE JUG IN THE HAND, ABOUT 6×', view: 'side', box: [-160, -280, 300, 260] }, { title: 'ABOVE · THE HANDS, ABOUT 6×', view: 'top', box: [-180, 0, 340, 420] }])}
      {L('players-f04-texture', 'F04 Impacts — the brush (Mei)', 'The block brush under the flat right hand, drawn across the fabric; the left hand flat on the board.', ImpactsArt as never, 'texture', [-300, -500, 2000, 2000], [-200, 0, 1800, 1600], [-250, -350, 700, 800], [-250, 0, 800, 700], [{ title: 'SIDE · THE HANDS, ABOUT 6×', view: 'side', box: [-150, -60, 340, 260] }, { title: 'ABOVE · THE HANDS, ABOUT 6×', view: 'top', box: [-150, -80, 340, 420] }])}
      {L('players-e07-piano', 'E07 Singer at the piano — Ana (the lesson’s singer)', 'The pianist’s playing position, the singer being Ana; the mouth drawn at the lesson’s measured lips (amber dot).', ((p: { view: 'side' | 'top'; v2?: boolean }) => <Group>{p.v2 !== undefined ? <E07Instrument view={p.view} variant="piano" v2={p.v2} /> : null}{p.view === 'side' ? <Circle cx={V_PIANO.lip.x} cy={V_PIANO.lip.y} r={6} color="#ffc64d" /> : null}</Group>) as never, 'piano', [V_PIANO.lip.x + 200, V_PIANO.lip.y + 400, 1600, 1500], [V_PIANO.lip.x + 300, 0, 1600, 1500], [V_PIANO.lip.x, V_PIANO.lip.y + 40, 300, 300], [V_PIANO.lip.x + 250, 0, 800, 900])}
      {L('players-e07-guitar', 'E07 Singer with a guitar — Ana (the lesson’s singer)', 'The seated guitarist (steel string), the singer being Ana; the mouth drawn at the lesson’s measured lips (amber dot).', ((p: { view: 'side' | 'top'; v2?: boolean }) => <Group>{p.v2 !== undefined ? <E07Instrument view={p.view} variant="guitar" v2={p.v2} /> : null}<Circle cx={V_GUITAR.lip.x} cy={p.view === 'side' ? V_GUITAR.lip.y : V_GUITAR.lip.z} r={6} color="#ffc64d" /></Group>) as never, 'guitar', [V_GUITAR.lip.x, V_GUITAR.lip.y + 500, 1600, 1600], [V_GUITAR.lip.x, V_GUITAR.lip.z, 1400, 1400], [V_GUITAR.lip.x, V_GUITAR.lip.y + 20, 300, 300], [V_GUITAR.lip.x, V_GUITAR.lip.z + 150, 800, 800])}
      {L('players-i11b', 'I11b Wurlitzer — the player (Kofi)', 'At the keys as the pianist plays (forearm level, wrist level with the knuckles, curved fingers, one pad on each white key, the thumb along its key); a real person turned to face the keys, so we see the left side; the near (left) foot on the sustain pedal where the lesson draws it.', ((p: { view: 'side' | 'top'; v2?: boolean }) => <WurliSection view={p.view} v2={p.v2} />) as never, 'std', [300, -650, 1500, 1400], [300, 0, 1400, 1300], [250, WURLI_W.keyTopY - 200, 700, 800], [200, 0, 800, 800], [
        { title: 'SIDE · THE NEAR HAND ON THE KEYS, ABOUT 6×', view: 'side', box: [0, WURLI_W.keyTopY - 40, 300, 220] },
        { title: 'ABOVE · THE HANDS ON THE KEYS, ABOUT 6×', view: 'top', box: [0, 0, 320, 620] },
      ])}
      {(['pedal', 'lever'] as const).map((v) => {
        const H = harpHands(v === 'lever');
        const R = H.R.sk.frame.o;
        const L2 = H.L.sk.frame.o;
        return L(`players-c10-${v}`, `C10 Harp (${v}) — the harpist (Ruth)`, 'The lesson’s own seated body and posed hands (each pad on a real string; the right hand on the near side of the strings, the left on the far side, seen through them), drawn in the approved look.', HarpArt as never, v, [-700, -900, 1900, 2000], [-700, 0, 1900, 1500], [R.x - 200, R.y - 250, 700, 800], [R.x - 150, (R.z + L2.z) / 2, 800, 800], [
          { title: 'SIDE · THE NEAR HAND ON THE STRINGS, ABOUT 6×', view: 'side', box: [R.x + 50, R.y + 10, 260, 260] },
          { title: 'SIDE · THE FAR HAND, ABOUT 6×', view: 'side', box: [L2.x + 50, L2.y + 10, 260, 260] },
          { title: 'ABOVE · THE HANDS, ABOUT 6×', view: 'top', box: [(R.x + L2.x) / 2 + 40, (R.z + L2.z) / 2, 320, 560] },
          { title: 'SIDE · THE HEAD AND THE SOUNDBOX’S TOP, ABOUT 3×', view: 'side', box: [v === 'lever' ? -790 : -700, v === 'lever' ? -1180 : -1330, 560, 380], wide: true },
          { title: 'SIDE · THE NEAR HAND, ABOUT 10×', view: 'side', box: [R.x + 70, R.y - 45, 200, 150], wide: true },
          { title: 'SIDE · THE FAR HAND, ABOUT 10×', view: 'side', box: [L2.x + 70, L2.y - 30, 200, 150], wide: true },
          { title: 'SIDE · THE NEAR ELBOW, ABOUT 6×', view: 'side', box: [H.R.elbow.x, H.R.elbow.y, 240, 180], wide: true },
        ]);
      })}
      {(['grand', 'upright'] as const).map((v) => {
        const k = PIANIST_AT[v].xKey;
        return L(`players-c11-${v}`, `C11 Piano (${v}) — the pianist (Mei)`, 'Seated at the lesson’s bench: the forearm level from the elbow to the wrist, the wrist level with the knuckles, each hand arched with curved fingers, one fingertip pad on each white key (right hand from middle C up, left an octave and a half below), the thumb along its key near the front; the right foot on the damper pedal, heel down.', PianoArt as never, v, [k - 300, PIANO_FLOOR - 650, 1700, 1500], [k - 200, 0, 1600, 1500], [k - 250, KEY_TOP_Y - 150, 700, 700], [k - 250, 0, 800, 900], [
          { title: 'SIDE · THE NEAR HAND ON THE KEYS, ABOUT 6×', view: 'side', box: [k - 20, KEY_TOP_Y - 40, 300, 220] },
          { title: 'ABOVE · THE HANDS ON THE KEYS, ABOUT 6×', view: 'top', box: [k - 20, 0, 320, 620] },
          { title: 'SIDE · THE FOOT ON THE PEDAL, ABOUT 6×', view: 'side', box: [PIANIST_AT[v].pedalX - 160, PIANO_FLOOR - 100, 400, 260] },
          { title: 'SIDE · THE NEAR HAND, ABOUT 12×', view: 'side', box: [k - 10, KEY_TOP_Y - 45, 170, 120] },
          { title: 'ABOVE · THE RIGHT HAND, ABOUT 10×', view: 'top', box: [k - 15, 105, 190, 150], wide: true },
          { title: 'ABOVE · THE LEFT HAND, ABOUT 10×', view: 'top', box: [k - 15, -105, 190, 150], wide: true },
          { title: 'SIDE · THE NEAR HAND, ABOUT 10×', view: 'side', box: [k - 10, KEY_TOP_Y - 40, 190, 120], wide: true },
        ]);
      })}
      {L('players-f05', 'F05 Perspective — the artist with the keys (Mei)', 'The key ring held in a loose right fist closed over the ring, the keys hanging free below it; the left hand at the side.', PerspectiveArt as never, 'studio', [-200, -480, 2000, 2000], [-200, 0, 1600, 1400], [-200, -320, 700, 800], [-200, 0, 800, 700], [{ title: 'SIDE · THE KEYS IN THE HAND, ABOUT 6×', view: 'side', box: [-20, 0, 260, 260] }, { title: 'ABOVE · THE KEYS IN THE HAND, ABOUT 6×', view: 'top', box: [-20, 0, 300, 300] }])}
    </View>
  );
}

/** Set 3b: seated or standing stick and mallet players, standing operators. */
function Set3b({ width }: { width: number }) {
  return (
    <View>
      <Lesson
        width={width}
        title="M06 Timpani — the timpanist (Kofi)"
        note="(Owner 2026-11-24, 'Raise the hands') The near (right) hand is the APPROVED MALLET HAND (#labpreview/FigureStudy/mallethand) on a level forearm, its grip raised 219 mm; the far (left) hand, palm side to the camera, keeps the drummer's palm-side fist, raised 43 mm. Earlier note: drawn with the approved kit drummer's arm and stick fists (owner 2026-11-24: elbows and hands): each arm solved from its shoulder (upper arm 300 mm, forearm 290 mm, the elbow below and a little outside), the hand closed on the shaft by the drummer's grip. From the side the near (right) hand shows its back, the far (left) its palm side, above and behind it; from above both are the drummer's fist from above. The left at the stroke on the 29 in head, the right raised. Beside the drummer: #labpreview/FigureStudy/players3bcheck."
        side={(v2) => <TimpaniArt view="side" variant="two" v2={v2} />}
        top={(v2) => <TimpaniArt view="top" variant="two" v2={v2} />}
        sideBox={[-200, -900, 2300, 2100]}
        topBox={[-150, -100, 2300, 2000]}
        zoomSide={[-660, -1120, 600, 620]}
        zoomTop={[-640, -380, 700, 560]}
        more={[
          // (owner 2026-11-24, "Raise the hands": the crops follow the raised grips)
          { title: 'SIDE · THE HANDS, ABOUT 6×', view: 'side', box: [(TIMP_MALLETS[0].hand.x + TIMP_MALLETS[1].hand.x) / 2 - 40, (TIMP_MALLETS[0].hand.y + TIMP_MALLETS[1].hand.y) / 2, 300, 300] },
          { title: 'ABOVE · THE HANDS, ABOUT 6×', view: 'top', box: [-560, -380, 320, 420] },
          { title: 'SIDE · THE NEAR ELBOW, ABOUT 6×', view: 'side', box: [TIMP_STICKS.R.elbow.x + 40, TIMP_STICKS.R.elbow.y, 300, 300] },
          { title: 'SIDE · THE NEAR HAND (THE APPROVED MALLET HAND), ABOUT 12×', view: 'side', box: [TIMP_MALLETS[1].hand.x - 40, TIMP_MALLETS[1].hand.y + 10, 150, 120] },
          { title: 'SIDE · THE FAR HAND (PALM SIDE: THE DRUMMER’S FIST), ABOUT 12×', view: 'side', box: [TIMP_MALLETS[0].hand.x - 30, TIMP_MALLETS[0].hand.y + 10, 150, 120] },
        ]}
      />
      <Lesson
        width={width}
        title="M07a Concert Bass Drum — the player (Ruth)"
        note="The player faces the playing head; the side camera sees her left side, so the mallet (on the camera's side of her, where the lesson has always drawn it) is in her LEFT hand, held a few centimeters from the handle's end; the right hand hangs on the far side. Her arm and fist are the approved kit drummer's (the back of the fist toward the camera; from above his fist from above). The current picture was a mirrored figure lit from the wrong side."
        side={(v2) => <ConcertBassDrumArt view="side" variant="std" v2={v2} />}
        top={(v2) => <ConcertBassDrumArt view="top" variant="std" v2={v2} />}
        sideBox={[200, 0, 2000, 2000]}
        topBox={[200, -200, 2000, 1800]}
        zoomSide={[560, -500, 700, 900]}
        zoomTop={[560, -380, 700, 560]}
        more={[
          { title: 'SIDE · THE HAND, ABOUT 6×', view: 'side', box: [BASS_FULCRUM.x + 40, BASS_FULCRUM.y - 30, 300, 300] },
          { title: 'ABOVE · THE HAND, ABOUT 6×', view: 'top', box: [BASS_FULCRUM.x + 40, BASS_FULCRUM.z, 300, 300] },
          { title: 'SIDE · THE WRIST, ABOUT 12×', view: 'side', box: [BASS_ARM.hold.wrist.x, BASS_ARM.hold.wrist.y, 150, 150] },
          { title: 'SIDE · THE ELBOW, ABOUT 6×', view: 'side', box: [BASS_ARM.elbow.x, BASS_ARM.elbow.y, 300, 300] },
        ]}
      />
      <Lesson
        width={width}
        title="I02 Cajón — the player (the drummer)"
        note="Seated astride the box, each hand flat on the front plate, fingers down: the right at a top corner (the slap), the left at the center (the bass). Each arm solved from its shoulder (upper arm 300 mm, forearm 290 mm, the elbow below and a little outside), the forearm straight to the wrist. From the right we see the right hand's little-finger edge and, beyond the box, the left hand's thumb side. From above the hands are the approved hand-drum hand at its true size, its wrist on the forearm's end, foreshortened only as the hand really tilts down the plate."
        side={(v2, hands) => <CajonArt view="side" variant="rear" v2={v2} focus={hands ? 'hands' : 'whole'} />}
        top={(v2) => <CajonArt view="top" variant="rear" v2={v2} />}
        sideBox={[50, -620, 1300, 1400]}
        topBox={[50, 0, 1300, 1000]}
        zoomSide={[60, -760, 600, 700]}
        zoomTop={[60, 0, 700, 600]}
        more={[
          { title: 'SIDE · THE HANDS ON THE PLATE (CAJON_NEAR_LEG.hands), ABOUT 6×', view: 'side', box: [cajState('rear').plateX, -480, 200, 260], hands: true },
          { title: 'ABOVE · THE HANDS ON THE PLATE, ABOUT 6×', view: 'top', box: [cajState('rear').plateX - 100, 0, 320, 420] },
          { title: 'SIDE · THE NEAR ARM (WHOLE FIGURE: TRUE DEPTH), ABOUT 3×', view: 'side', box: [0, -660, 500, 420] },
        ]}
      />
    </View>
  );
}

type Cell = { title: string; draw: ReactNode; b: [number, number, number, number] };
/** Rows of pictures in ONE canvas, each cropped to its box (mm: centre u, v, width, height) at its own scale. */
function Grid({ width, title, note, rows }: { width: number; title: string; note?: string; rows: Cell[][] }) {
  const gap = 8;
  const lab = 16;
  type Item = Cell & { w: number; x: number; y: number; h: number };
  const items: Item[] = [];
  let y = 0;
  for (const cells of rows) {
    const w = Math.floor((width - 24 - gap * (cells.length - 1)) / cells.length);
    const h = Math.max(...cells.map((c) => (c.b[3] * w) / c.b[2]));
    cells.forEach((c, i) => items.push({ ...c, w, x: i * (w + gap), y, h }));
    y += h + lab + gap;
  }
  const W = width - 24;
  return (
    <View style={{ marginBottom: 24 }}>
      <Head title={title} note={note} />
      <View>
        <Canvas style={{ width: W, height: y }}>
          {items.map((q, i) => {
            const k = q.w / q.b[2];
            return (
              <Group key={i} clip={Skia.XYWHRect(q.x, q.y, q.w, q.h)}>
                <Rect x={q.x} y={q.y} width={q.w} height={q.h} color={STAGE} />
                <Group transform={[{ translateX: q.x + q.w / 2 - q.b[0] * k }, { translateY: q.y + q.h / 2 - q.b[1] * k }, { scale: k }]}>
                  <FigureScale ptPerMm={k}>{q.draw}</FigureScale>
                </Group>
              </Group>
            );
          })}
        </Canvas>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: y }} pointerEvents="none">
          {items.map((q, i) => (
            <Text key={i} style={{ position: 'absolute', left: q.x, top: q.y + q.h + 1, color: DIM, fontSize: 11, width: q.w }}>
              {q.title} · {(q.w / q.b[2]).toFixed(2)} pt/mm
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * (owner 2026-11-24, "the elbows and hands (many) are odd") The approved kit drummer beside the players drawn
 * with his pieces, at the SAME scale in each row: the arms and elbows from the side, the fists from the side, the
 * arms and fists from above. Page: `#labpreview/FigureStudy/players3bcheck`.
 */
function Check3b({ width }: { width: number }) {
  const kitS = <KitSide reach={false} keepOuts={false} figureV2 />;
  const kitT = <KitTop reach={false} keepOuts={false} figureV2 />;
  const tS = <TimpaniArt view="side" variant="two" v2 />;
  const tT = <TimpaniArt view="top" variant="two" v2 />;
  const bS = <ConcertBassDrumArt view="side" variant="std" v2 />;
  const bT = <ConcertBassDrumArt view="top" variant="std" v2 />;
  const cS = <CajonArt view="side" variant="rear" v2 />;
  const cT = <CajonArt view="top" variant="rear" v2 />;
  const TS = TIMP_STICKS;
  const BA = BASS_ARM;
  return (
    <View>
      <Grid
        width={width}
        title="Arms and elbows from the side — the drummer (approved) beside the players, 0.6 pt/mm"
        rows={[
          [
            { title: 'DRUMMER', draw: kitS, b: [-760, -720, 760, 700] },
            { title: 'M06 TIMPANIST', draw: tS, b: [(TS.R.shoulder.x + TS.R.hold.fulcrum.x) / 2, (TS.R.shoulder.y + TS.R.hold.fulcrum.y) / 2, 760, 700] },
          ],
          [
            { title: 'M07a BASS DRUM', draw: bS, b: [(BA.shoulder.x + BA.hold.fulcrum.x) / 2, (BA.shoulder.y + BA.hold.fulcrum.y) / 2, 760, 700] },
            { title: 'I02 CAJÓN', draw: cS, b: [0, -700, 760, 700] },
          ],
        ]}
      />
      <Grid
        width={width}
        title="Fists on the stick from the side — the drummer (approved) beside the players, the same scale"
        rows={[
          [
            { title: 'DRUMMER (NEAR HAND)', draw: kitS, b: [-620, -520, 240, 200] },
            { title: 'M06 BOTH HANDS', draw: tS, b: [(TIMP_MALLETS[0].hand.x + TIMP_MALLETS[1].hand.x) / 2 - 40, (TIMP_MALLETS[0].hand.y + TIMP_MALLETS[1].hand.y) / 2, 240, 300] },
          ],
          [
            { title: 'M07a THE HAND', draw: bS, b: [BA.hold.fulcrum.x + 40, BA.hold.fulcrum.y - 30, 240, 200] },
            { title: 'I02 THE HANDS (GHOST LEG)', draw: <CajonArt view="side" variant="rear" v2 focus="hands" />, b: [cajState('rear').plateX - 40, -480, 240, 200] },
          ],
          [
            { title: 'I02 THE NEAR ARM OVER THE THIGH (TRUE DEPTH)', draw: cS, b: [20, -600, 240, 200] },
            { title: 'I02 THE KNEE AND THE PLATE (TRUE DEPTH)', draw: cS, b: [cajState('rear').plateX - 40, -480, 240, 200] },
          ],
        ]}
      />
      <Grid
        width={width}
        title="Arms and fists from above — the drummer (approved) beside the players"
        rows={[
          [
            { title: 'DRUMMER', draw: kitT, b: [-650, -180, 1000, 1000] },
            { title: 'M06', draw: tT, b: [-620, -380, 1000, 1000] },
          ],
          [
            { title: 'M07a', draw: bT, b: [560, -300, 1000, 1000] },
            { title: 'I02', draw: cT, b: [-20, 0, 1000, 1000] },
          ],
          [
            { title: 'DRUMMER, A FIST', draw: kitT, b: [-640, -480, 240, 240] },
            { title: 'M06 NEAR FIST', draw: tT, b: [TS.R.hold.fulcrum.x - 40, TS.R.hold.fulcrum.z, 240, 240] },
            { title: 'M06 FAR FIST', draw: tT, b: [TS.L.hold.fulcrum.x - 40, TS.L.hold.fulcrum.z, 240, 240] },
            { title: 'M07a FIST', draw: bT, b: [BA.hold.fulcrum.x + 40, BA.hold.fulcrum.z, 240, 240] },
          ],
        ]}
      />
    </View>
  );
}

export function PlayersStudy({ width, only }: { width: number; only: string }) {
  if (only === 'players3bcheck') return <Check3b width={width} />;
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>The players — current beside new</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 12 }}>Each lesson’s own picture with the switch off and on; enlarged about 3× below.</Text>
      {only === 'players' || only === 'players3b' ? <Set3b width={width} /> : null}
      {only.startsWith('players-f') || only.startsWith('players-c') || only.startsWith('players-i') || only.startsWith('players-e') ? <Foley width={width} only={only} /> : null}
    </View>
  );
}
