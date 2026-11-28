/**
 * FIGURE STUDY — "ELSEWHERE" (waves 6 and 7 of D78, 2026-11-24): the figures
 * outside Miking, the ensemble seatings and plan markers, the voice cut-away.
 * DEV + WEB ONLY: `#labpreview/FigureStudy/elsewhere`. Each figure OLD beside
 * NEW, at its lesson size and enlarged about 3×, every person who plays it.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { castFor, CAST, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PersonSideV2, PersonTopV2 } from '../screens/lab/miking/lessons/shared/figureV2/personV2';
import { PlayerTopV2 } from '../screens/lab/miking/lessons/shared/figureV2/elsewhereTop';
import { PlayerBehind, PlayerInFront, FigureHead, headAbove } from '../screens/lab/miking/lessons/shared/players/PlayerFigure';
import { pt } from '../screens/lab/miking/lessons/shared/players/playerPose';
import { SINGER_SIDE, SINGER_TOP } from '../screens/lab/miking/lessons/shared/voice/voicePose';
import { PlanInstrumentEdge, PlanPlayerTop } from '../screens/lab/miking/lessons/shared/speakers/BacklinePlan';
import { BAND_TOP_PLAYERS } from '../screens/lab/miking/lessons/shared/figureV2/elsewhereBand';
import { OldVoiceCutaway } from './oldVoiceCutaway';
import Svg, { G as SG, Rect as SRect } from 'react-native-svg';
import { FigureAboveSvg } from '../features/lab/figureAboveSvg';
import { FigureSeatedSideSvg } from '../features/lab/figureBodySvg';
import { PersonAboveSvg, PersonFrontSvg, PersonSeatedSideSvg, castForKey, castInTurn } from '../features/lab/figureV2Svg';
import { FigureStandingFrontSvg } from '../features/lab/figureBodySvg';
import { PersonScaleOld } from '../screens/lab/cableinstall/svgArt';
import { VenueView } from '../screens/lab/soundsystems/art/VenueView';
import { FeedbackLoop } from '../screens/lab/soundsystems/art/diagrams';
import { KeysPlan } from '../screens/lab/miking/lessons/shared/keys/KeysPlan';
import { BacklinePlan } from '../screens/lab/miking/lessons/shared/speakers/BacklinePlan';
import { ClavinetPlan } from '../screens/lab/miking/lessons/c12Clavinet/art';
import { MarkerTopV2 } from '../screens/lab/miking/lessons/shared/figureV2/elsewhereTop';
import { handDrumPlayer } from '../screens/lab/miking/lessons/shared/figureV2/markerPose';
import { Circle as SkCircle, drawAsPicture, drawAsImageFromPicture } from '@shopify/react-native-skia';
import { FigureStandingAt, STANDING_H_MM } from '../features/lab/figureHead';
import { PersonStandingFrontAt } from '../features/lab/figureV2Front';
import { clapPose } from '../screens/lab/miking/lessons/shared/sports/BoundaryArt';
import { ClapperV2 } from '../screens/lab/miking/lessons/shared/figureV2/clapV2';
import { SeatingView } from '../screens/lab/miking/lessons/shared/ensemble/SeatingArt';
import { seatingOf, type SeatingId } from '../screens/lab/miking/lessons/shared/ensemble/seating';

/** (dev) the orchestra plan's paint time, v2 off and on: the picture recorded (the tree drawn once), then replayed
 *  onto an offscreen surface 10 times (the per-frame cost), and the second recording (the plans cached). */
function OrchPerf({ id }: { id: SeatingId }) {
  const [out, setOut] = useState('measuring…');
  useEffect(() => {
    let live = true;
    (async () => {
      const st = seatingOf(id).stage;
      const W = 360;
      const k = W / (st.x1 - st.x0 + 800);
      const H = Math.round((st.z1 - st.z0 + 800) * k);
      const lines: string[] = [];
      for (const v2 of [false, true]) {
        const el = (
          <Group transform={[{ translateX: W / 2 - ((st.x0 + st.x1) / 2) * k }, { translateY: H / 2 - ((st.z0 + st.z1) / 2) * k }, { scale: k }]}>
            <SeatingView seating={seatingOf(id)} view="plan" v2={v2} />
          </Group>
        );
        const t0 = performance.now();
        await drawAsPicture(el);
        const t1 = performance.now();
        const pic = await drawAsPicture(el);
        const t2 = performance.now();
        for (let i = 0; i < 10; i++) drawAsImageFromPicture(pic, { width: W * 2, height: H * 2 });
        const t3 = performance.now();
        lines.push(`${id} v2 ${v2 ? 'ON ' : 'off'}: first record ${(t1 - t0).toFixed(1)} ms, record ${(t2 - t1).toFixed(1)} ms, replay ${((t3 - t2) / 10).toFixed(2)} ms`);
      }
      if (live) {
        setOut(lines.join(' | '));
        (globalThis as { __orchPerf?: string }).__orchPerf = lines.join(' | ');
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);
  return <Text style={{ color: INK, fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{out}</Text>;
}

/** A seating's plan (from above), fitted, v2 off or on. */
function SeatPlan({ id, v2, w, title, zoom, view = 'plan' }: { id: SeatingId; v2: boolean; w: number; title: string; zoom?: { cu: number; cv: number; mm: number }; view?: 'plan' | 'front' | 'section' }) {
  const st = seatingOf(id).stage;
  const elev = view !== 'plan';
  const mmW = zoom ? zoom.mm : view === 'section' ? st.z1 - st.z0 + 800 : st.x1 - st.x0 + 800;
  const mmH = zoom ? zoom.mm * 0.75 : elev ? 2600 : st.z1 - st.z0 + 800;
  const cu = zoom ? zoom.cu : view === 'section' ? -(st.z0 + st.z1) / 2 : (st.x0 + st.x1) / 2;
  const cv = zoom ? zoom.cv : elev ? -1000 : (st.z0 + st.z1) / 2;
  return (
    <Pic title={title} cu={cu} cv={cv} mmW={mmW} mmH={mmH} w={w}>
      <SeatingView seating={seatingOf(id)} view={view} v2={v2} />
    </Pic>
  );
}
import { VoiceCutaway, type CutawayTint } from '../screens/lab/miking/lessons/shared/voice/VoiceCutaway';

const TINT: CutawayTint = { pipe: null, folds: '#ffc64d', tract: '#ffc64d', nasal: null };
const NO_TINT: CutawayTint = { pipe: null, folds: null, tract: null, nasal: null };

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

/** One picture: a window (mm) round (cu, cv), `w` pt wide. */
function Pic({ title, cu, cv, mmW, mmH, w, children }: { title: string; cu: number; cv: number; mmW: number; mmH: number; w: number; children: ReactNode }) {
  const s = w / mmW;
  const h = mmH * s;
  return (
    <View style={{ marginRight: 10, marginBottom: 10 }}>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 3, maxWidth: w }}>{title}</Text>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: h / 2 - cv * s }, { scale: s }]}>
          <FigureScale ptPerMm={s}>{children}</FigureScale>
        </Group>
      </Canvas>
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</View>;
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginTop: 14, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

/** An SVG picture (the SVG screens): `w` pt wide, a window of `mmW` × `mmH` mm round (cu, cv). */
function SvgPic({ title, cu, cv, mmW, mmH, w, children }: { title: string; cu: number; cv: number; mmW: number; mmH: number; w: number; children: (k: number) => ReactNode }) {
  const k = w / mmW;
  const h = mmH * k;
  return (
    <View style={{ marginRight: 10, marginBottom: 10 }}>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 3, maxWidth: w }}>{title}</Text>
      <Svg width={w} height={h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SRect x={0} y={0} width={w} height={h} fill={STAGE} />
        <SG transform={`translate(${w / 2 - cu * k} ${h / 2 - cv * k})`}>{children(k)}</SG>
      </Svg>
    </View>
  );
}

const ALL: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];

/* ── the old plan players (BacklinePlan + the head from above), as Speaker Coverage draws them ── */
function OldBand({ kind }: { kind: 'guitar' | 'bass' }) {
  const head = useMemo(() => headAbove(pt(0, 0), 100).fill, []);
  return (
    <Group>
      <PlanInstrumentEdge bass={kind === 'bass'} />
      <PlanPlayerTop pose={kind} />
      <Group transform={[{ rotate: -Math.PI / 2 }]}>
        <FigureHead fill={head} />
      </Group>
    </Group>
  );
}
function NewBand({ kind }: { kind: 'guitar' | 'bass' }) {
  return (
    <Group>
      <PlanInstrumentEdge bass={kind === 'bass'} />
      <PlayerTopV2 player={BAND_TOP_PLAYERS[kind]} who={castFor(kind === 'bass' ? 'coverage.bass' : 'coverage.guitar')} />
    </Group>
  );
}

const OLD_TOP = (
  <Group>
    <PlayerBehind pose={SINGER_TOP} />
    <PlayerInFront pose={SINGER_TOP} hands={false} />
  </Group>
);
const OLD_SIDE = (
  <Group>
    <PlayerBehind pose={SINGER_SIDE} />
    <PlayerInFront pose={SINGER_SIDE} />
  </Group>
);

/** `part`: '' every section; 'top', 'side', 'cutaway', 'band' one alone (`#labpreview/FigureStudy/elsewhere-cutaway`). */
export function ElsewhereStudy({ width, part = '' }: { width: number; part?: string }) {
  const show = (k: string) => !part || part === k;
  const small = 120;
  const big = Math.min(width - 24, 360);
  const ids: CastId[] = ['kofi', 'mei', 'ana'];
  const fixW = Math.max(240, Math.min(700, width - 30));
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Figures elsewhere — waves 6 and 7</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 6 }}>Each figure OLD beside NEW. The new figure stands exactly where the old one stood.</Text>

      {show('top') ? (<>
      <Head title="1 · A LISTENER OR SINGER FROM ABOVE" note="Game Audio (YOU = Kofi, the guide = Mei: the map, the 5.1 layout, the HUD), Mic Selection (the singer = Ana, beside the kit drummer). Chest toward the right." />
      <Row>
        <Pic title="OLD" cu={-40} cv={0} mmW={700} mmH={520} w={small}>{OLD_TOP}</Pic>
        {ids.map((id) => (
          <Pic key={id} title={`NEW · ${CAST[id].name}`} cu={-40} cv={0} mmW={700} mmH={520} w={small}>
            <PersonTopV2 pose={SINGER_TOP} who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      <Row>
        <Pic title="OLD · enlarged" cu={-40} cv={0} mmW={600} mmH={520} w={big}>{OLD_TOP}</Pic>
        <Pic title="NEW · Kofi enlarged" cu={-40} cv={0} mmW={600} mmH={520} w={big}>
          <PersonTopV2 pose={SINGER_TOP} who={CAST.kofi} />
        </Pic>
      </Row>

      </>) : null}
      {show('side') ? (<>
      <Head title="2 · THE SINGER AT A VOCAL STAND, SIDE (Speaker Coverage)" note="Ana; the hands at rest. The stand and the mic are drawn by the lab over her." />
      <Row>
        <Pic title="OLD" cu={-40} cv={600} mmW={900} mmH={1900} w={small}>{OLD_SIDE}</Pic>
        <Pic title="NEW · Ana" cu={-40} cv={600} mmW={900} mmH={1900} w={small}>
          <PersonSideV2 pose={SINGER_SIDE} who={castFor('voice.singer')} opts={{ lip: { u: 0, v: 0 }, rest: 'restSide' }} />
        </Pic>
        <Pic title="NEW · Ana, upper body enlarged" cu={-60} cv={250} mmW={700} mmH={900} w={big}>
          <PersonSideV2 pose={SINGER_SIDE} who={castFor('voice.singer')} opts={{ lip: { u: 0, v: 0 }, rest: 'restSide' }} />
        </Pic>
      </Row>

      </>) : null}
      {show('svg') ? (<>
      <Head title="5 · SVG SCREENS: A STANDING PERSON FROM ABOVE (Sound Systems performers, Stage Plot performer)" note="The same plan as the Skia top view (topPerson.ts), painted in SVG at the light level. Facing down the plan (toward the house). Old, then each cast member." />
      <Row>
        <SvgPic title="OLD" cu={0} cv={0} mmW={640} mmH={560} w={small}>{(k) => <FigureAboveSvg x={0} y={0} pxPerMm={k} />}</SvgPic>
        {ALL.map((id) => (
          <SvgPic key={id} title={`NEW · ${CAST[id].name}`} cu={0} cv={0} mmW={640} mmH={560} w={small}>{(k) => <PersonAboveSvg x={0} y={0} pxPerMm={k} who={CAST[id]} />}</SvgPic>
        ))}
      </Row>
      <Row>
        <SvgPic title="OLD · enlarged" cu={0} cv={0} mmW={600} mmH={520} w={big}>{(k) => <FigureAboveSvg x={0} y={0} pxPerMm={k} />}</SvgPic>
        <SvgPic title="NEW · Ana enlarged" cu={0} cv={0} mmW={600} mmH={520} w={big}>{(k) => <PersonAboveSvg x={0} y={0} pxPerMm={k} who={CAST.ana} />}</SvgPic>
      </Row>
      <Head title="5b · STAGE PLOT PERFORMERS: THE OWNER'S CHOICE" note="Twelve named performers (the Salsa example). (A) cast members, the same object always the same person (people repeat: five faces); (B) the plot's old faceless symbol. One constant flips it: stageArt.tsx PERFORMERS_AS_CAST." />
      <Row>
        <SvgPic title="(A) cast members — built, the default" cu={0} cv={0} mmW={3200} mmH={1300} w={big}>{(k) => <SG>{Array.from({ length: 12 }, (_, i) => <PersonAboveSvg key={i} x={((i % 6) - 2.5) * 520 * k} y={(Math.floor(i / 6) - 0.5) * 600 * k} pxPerMm={k} halo="#c3cde2" who={castForKey(`sp-performer-${i}`)} />)}</SG>}</SvgPic>
        <SvgPic title="(B) the old symbol" cu={0} cv={0} mmW={3200} mmH={1300} w={big}>{(k) => <SG>{Array.from({ length: 12 }, (_, i) => <FigureAboveSvg key={i} x={((i % 6) - 2.5) * 520 * k} y={(Math.floor(i / 6) - 0.5) * 600 * k} pxPerMm={k} halo="#c3cde2" />)}</SG>}</SvgPic>
      </Row>
      <Head title="6 · THE CHOIR ON A RISER, NARROW BUILD (Stage Plot)" note="Singers 0.44 m apart, as the riser lays them out; with the halo, at the plot's size (0.032 px/mm here ×3) and enlarged." />
      <Row>
        <SvgPic title="OLD" cu={880} cv={0} mmW={2200} mmH={600} w={big}>{(k) => <SG>{[0, 1, 2, 3, 4].map((i) => <FigureAboveSvg key={i} x={i * 440 * k} y={0} pxPerMm={k} halo="#c3cde2" build="narrow" />)}</SG>}</SvgPic>
        <SvgPic title="NEW (the cast in turn)" cu={880} cv={0} mmW={2200} mmH={600} w={big}>{(k) => <SG>{[0, 1, 2, 3, 4].map((i) => <PersonAboveSvg key={i} x={i * 440 * k} y={0} pxPerMm={k} who={castInTurn(i)} halo="#c3cde2" build="narrow" />)}</SG>}</SvgPic>
      </Row>
      <Head title="7 · THE SEATED LISTENER IN PROFILE (Room Design side view)" note="Placed by the ear (1.2 m here), facing the speakers (left). The seat follows the ear's height as before; the hands rest on the thighs (the approved desk hand)." />
      <Row>
        <SvgPic title="OLD" cu={-150} cv={-700} mmW={1300} mmH={1500} w={small * 1.3}>{(k) => <FigureSeatedSideSvg earX={0} earY={-1200 * k} floorY={0} px={k} facing={-1} />}</SvgPic>
        {ALL.map((id) => (
          <SvgPic key={id} title={`NEW · ${CAST[id].name}`} cu={-150} cv={-700} mmW={1300} mmH={1500} w={small * 1.3}>{(k) => <PersonSeatedSideSvg earX={0} earY={-1200 * k} floorY={0} px={k} who={CAST[id]} facing={-1} />}</SvgPic>
        ))}
      </Row>
      <Row>
        <SvgPic title="NEW · Mei, ear at 1.0 m (low chair)" cu={-150} cv={-600} mmW={1300} mmH={1400} w={big}>{(k) => <PersonSeatedSideSvg earX={0} earY={-1000 * k} floorY={0} px={k} who={CAST.mei} facing={-1} />}</SvgPic>
        <SvgPic title="NEW · Mei, ear at 1.5 m (tall chair, footrest)" cu={-150} cv={-800} mmW={1300} mmH={1700} w={big}>{(k) => <PersonSeatedSideSvg earX={0} earY={-1500 * k} floorY={0} px={k} who={CAST.mei} facing={-1} />}</SvgPic>
        <SvgPic title="NEW · Mei, hands enlarged" cu={-250} cv={-560} mmW={420} mmH={360} w={big}>{(k) => <PersonSeatedSideSvg earX={0} earY={-1200 * k} floorY={0} px={k} who={CAST.mei} facing={-1} />}</SvgPic>
      </Row>
      </>) : null}
      {show('markers') ? (<>
      <Head title="9 · PLAN MARKERS BEHIND `v2` (OFF in the app until each lesson switches with its own player)" note="The lessons' own plan components, drawn with v2 off (left) and on (right). Keys (Rhodes, Wurlitzer), backline (guitar, bass, steel), the clavinet; then the hand-drum player and the standing marker (singers, accompanists, stage-plan spots) alone." />
      {(['rhodes', 'wurli'] as const).map((rig) => (
        <Row key={rig}>
          {[false, true].map((on) => (
            <View key={String(on)} style={{ marginRight: 10, marginBottom: 10 }}>
              <Text style={{ color: DIM, fontSize: 11 }}>{`KEYS ${rig} · v2 ${on ? 'ON' : 'off'}`}</Text>
              <KeysPlan w={big} h={big * 0.75} rig={rig} scene="studio" wedges={[]} highlight={null} onTap={() => {}} shortOf={(id) => id} accessibilityLabel="study" v2={on} />
            </View>
          ))}
        </Row>
      ))}
      {(['guitar', 'bass', 'steel'] as const).map((who) => (
        <Row key={who}>
          {[false, true].map((on) => (
            <View key={String(on)} style={{ marginRight: 10, marginBottom: 10 }}>
              <Text style={{ color: DIM, fontSize: 11 }}>{`BACKLINE ${who} · v2 ${on ? 'ON' : 'off'}`}</Text>
              <BacklinePlan w={big} h={big * 0.75} who={who} scene="studio" wedges={[]} highlight={null} onTap={() => {}} shortOf={(id) => id} accessibilityLabel="study" v2={on} />
            </View>
          ))}
        </Row>
      ))}
      </>) : null}
      {show('front') ? (<>
      <Head title="11 · THE STANDING PERSON FROM THE FRONT, FOR SCALE (Foundations M6 ruler, Wave Physics)" note="Drawn the old figure's height (1755 mm; Wave Physics 1745 mm), the feet's center where the old feet were. The front view is the front-view builder's (FigureV2Front.tsx, its faces being redrawn)." />
      <Row>
        <Pic title="OLD" cu={0} cv={-880} mmW={900} mmH={1900} w={small}><FigureStandingAt cx={0} floorY={0} pxPerMm={1} /></Pic>
        {ALL.map((id) => (
          <Pic key={id} title={`NEW · ${CAST[id].name}`} cu={0} cv={-880} mmW={900} mmH={1900} w={small}>
            <PersonStandingFrontAt cx={0} floorY={0} pxPerMm={1} who={CAST[id]} heightMm={STANDING_H_MM} />
          </Pic>
        ))}
      </Row>
      <Row>
        <Pic title="NEW · Ruth (Foundations) enlarged" cu={0} cv={-1100} mmW={700} mmH={1400} w={big}><PersonStandingFrontAt cx={0} floorY={0} pxPerMm={1} who={CAST.ruth} heightMm={STANDING_H_MM} /></Pic>
        <Pic title="NEW · Kofi (Wave Physics) enlarged" cu={0} cv={-1100} mmW={700} mmH={1400} w={big}><PersonStandingFrontAt cx={0} floorY={0} pxPerMm={1} who={CAST.kofi} heightMm={1745} /></Pic>
      </Row>
      <Head title="11b · THE SAME IN SVG (the EQ lab's camera analogy: Ana; Cable Install's person for scale: Kofi, and Ana)" note="Old (the SVG front figure; Cable Install's flat graphite figure), then the cast in SVG from the same front plan." />
      <Row>
        <SvgPic title="OLD · EQ camera" cu={0} cv={-880} mmW={900} mmH={1900} w={small}>{(k) => <FigureStandingFrontSvg cx={0} floorY={0} px={k} />}</SvgPic>
        <SvgPic title="OLD · Cable Install" cu={0} cv={-880} mmW={900} mmH={1900} w={small}>{(k) => <PersonScaleOld x={0} floorY={0} m={k * 1000} />}</SvgPic>
        {ALL.map((id) => (
          <SvgPic key={id} title={`NEW SVG · ${CAST[id].name}`} cu={0} cv={-880} mmW={900} mmH={1900} w={small}>{(k) => <PersonFrontSvg cx={0} floorY={0} px={k} who={CAST[id]} />}</SvgPic>
        ))}
      </Row>
      <Row>
        <SvgPic title="NEW SVG · Ana enlarged" cu={0} cv={-1100} mmW={700} mmH={1400} w={big}>{(k) => <PersonFrontSvg cx={0} floorY={0} px={k} who={CAST.ana} />}</SvgPic>
        <SvgPic title="NEW SVG · Kofi, hand enlarged" cu={-230} cv={-760} mmW={260} mmH={300} w={big}>{(k) => <PersonFrontSvg cx={0} floorY={0} px={k} who={CAST.kofi} />}</SvgPic>
      </Row>
      </>) : null}
      {show('seating') ? (<>
      <Head title="10 · ENSEMBLE SEATINGS FROM ABOVE BEHIND `v2` (OFF in the app)" note="Each plan with v2 off, then on (the cast in turn by seat; the arms each seat poses, the approved fist or flat hand). Front and section views follow the front view." />
      {(['quartet.arc', 'chamber.mixed', 'choir.risers', 'bb.standard'] as SeatingId[]).map((id) => (
        <Row key={id}>
          <SeatPlan id={id} v2={false} w={Math.min(big, 330)} title={`${id} · v2 off`} />
          <SeatPlan id={id} v2 w={Math.min(big, 330)} title={`${id} · v2 ON`} />
        </Row>
      ))}
      </>) : null}
      {show('lessons') ? (<>
      <Head title="12 · THE ENSEMBLE LESSONS SWITCHED ON WHOLE (E02, E04, E08, E10): plan, front, section" note="Each seating as the lesson shows it, v2 ON in all three views (the app now draws these)." />
      {(['vocal.line', 'duo.shared', 'acoustic.trio', 'horns.arc'] as SeatingId[]).map((id) => (
        <Row key={id}>
          <SeatPlan id={id} v2 w={Math.min(big, 300)} title={`${id} · plan`} />
          <SeatPlan id={id} v2 w={Math.min(big, 300)} title={`${id} · front`} view="front" />
          <SeatPlan id={id} v2 w={Math.min(big, 300)} title={`${id} · section`} view="section" />
        </Row>
      ))}
      </>) : null}
      {show('lessons2') ? (<>
      <Head title="12b · ENLARGED: the acoustic trio and the horn section, front and section, and the trio from above" />
      <Row>
        <SeatPlan id="acoustic.trio" v2 w={big} title="acoustic.trio · front, enlarged" view="front" zoom={{ cu: 0, cv: -800, mm: 2600 }} />
        <SeatPlan id="acoustic.trio" v2 w={big} title="acoustic.trio · plan, enlarged" zoom={{ cu: 0, cv: -200, mm: 2600 }} />
      </Row>
      <Row>
        <SeatPlan id="horns.arc" v2 w={big} title="horns.arc · front, enlarged" view="front" zoom={{ cu: 0, cv: -900, mm: 3200 }} />
        <SeatPlan id="horns.arc" v2 w={big} title="horns.arc · section, enlarged" view="section" zoom={{ cu: 0, cv: -900, mm: 3200 }} />
      </Row>
      </>) : null}
      {part.startsWith('fix') ? (<>
      <Head title="12c · ENSEMBLES3 REPAIRS, each player enlarged (front, section, from above)" note="fixa trio · fixb horns front · fixc horns section · fixd quartet from above · fix all" />
      {part === 'fix' || part === 'fixa' ? (<Row>
        <SeatPlan id="acoustic.trio" v2 w={fixW} title="trio · Ana, guitar · front" view="front" zoom={{ cu: -1112, cv: -800, mm: 1300 }} />
        <SeatPlan id="acoustic.trio" v2 w={fixW} title="trio · fiddle · front" view="front" zoom={{ cu: 0, cv: -900, mm: 1300 }} />
        <SeatPlan id="acoustic.trio" v2 w={fixW} title="trio · bass · front" view="front" zoom={{ cu: 1266, cv: -1250, mm: 1300 }} />
      </Row>) : null}
      {part === 'fix' || part === 'fixb' ? (<Row>
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns · trumpet · front" view="front" zoom={{ cu: -1213, cv: -1000, mm: 1300 }} />
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns · sax, trombone · front" view="front" zoom={{ cu: 0, cv: -1000, mm: 1600 }} />
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns · tuba · front" view="front" zoom={{ cu: 1213, cv: -1150, mm: 1300 }} />
      </Row>) : null}
      {part === 'fix' || part === 'fixc' ? (<Row>
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns · section" view="section" zoom={{ cu: 0, cv: -1000, mm: 2600 }} />
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns · section, the tuba and trombone" view="section" zoom={{ cu: 400, cv: -1100, mm: 1400 }} />
      </Row>) : null}
      {part === 'fix' || part === 'fixe' ? (<Row>
        <SeatPlan id="quartet.arc" v2 w={fixW} title="quartet · front (the outer chairs turned 60°)" view="front" />
        <SeatPlan id="horns.arc" v2 w={fixW} title="horns.arc · front, lesson framing" view="front" />
        <SeatPlan id="orch.american" v2 w={fixW} title="orch.american · front" view="front" />
      </Row>) : null}
      {part === 'fix' || part === 'fixf' ? (<Row>
        <SeatPlan id="orch.american" v2 w={fixW} title="orch.american · front, the left wing" view="front" zoom={{ cu: -3600, cv: -1000, mm: 3000 }} />
        <SeatPlan id="orch.american" v2 w={fixW} title="orch.american · front, the right wing" view="front" zoom={{ cu: 3600, cv: -1000, mm: 3000 }} />
      </Row>) : null}
      {part === 'fix' || part === 'fixd' ? (<Row>
        <SeatPlan id="quartet.arc" v2 w={fixW} title="quartet violin 2 · above, the head and the violin's chin end" zoom={{ cu: -380, cv: -230, mm: 320 }} />
        <SeatPlan id="quartet.arc" v2 w={fixW} title="quartet violin 2 · above" zoom={{ cu: -330, cv: -100, mm: 700 }} />
        <SeatPlan id="quartet.arc" v2 w={fixW} title="quartet viola, cello · above" zoom={{ cu: 900, cv: 200, mm: 1300 }} />
      </Row>) : null}
      </>) : null}
      {show('clap') ? (<>
      <Head title="14 · B14: THE CLAPPER IN PROFILE (Mei), facing the mic" note="The lesson's own pose (the hands 300 mm in front at the source's height). Old, new, and the hands enlarged: one hand cupped across the other." />
      <Row>
        <Pic title="OLD" cu={150} cv={-950} mmW={900} mmH={1900} w={small * 1.2}>
          <Group transform={[{ translateX: 300 }, { scaleX: -1 }]}>
            <PlayerBehind pose={clapPose(1000)} />
            <PlayerInFront pose={clapPose(1000)} />
          </Group>
        </Pic>
        <Pic title="NEW" cu={150} cv={-950} mmW={900} mmH={1900} w={small * 1.2}>
          <Group transform={[{ translateX: 300 }]}>
            <ClapperV2 pose={clapPose(1000)} who={CAST.mei} />
          </Group>
        </Pic>
        <Pic title="NEW · the hands enlarged" cu={0} cv={-1020} mmW={360} mmH={320} w={big}>
          <Group transform={[{ translateX: 300 }]}>
            <ClapperV2 pose={clapPose(1000)} who={CAST.mei} />
          </Group>
        </Pic>
      </Row>
      <Row>
        <Pic title="NEW · the hands, about 3× (the bar)" cu={-110} cv={-1070} mmW={340} mmH={280} w={Math.min(width - 16, 760)}>
          <Group transform={[{ translateX: 300 }]}>
            <ClapperV2 pose={clapPose(1000)} who={CAST.mei} />
          </Group>
        </Pic>
        <Pic title="NEW · the fingers, closer" cu={-70} cv={-1075} mmW={170} mmH={130} w={Math.min(width - 16, 380)}>
          <Group transform={[{ translateX: 300 }]}>
            <ClapperV2 pose={clapPose(1000)} who={CAST.mei} />
          </Group>
        </Pic>
      </Row>
      </>) : null}
      {show('perf') ? (<>
      <Head title="13 · PAINT TIME OF THE 58-FIGURE ORCHESTRA PLAN (dev)" note="Web (CanvasKit) in this browser: the record is the React tree drawn once; the replay is the per-frame paint." />
      <OrchPerf id="orch.american" />
      <OrchPerf id="strings.american" />
      </>) : null}
      {show('seating2') ? (<>
      <Head title="10b · THE ORCHESTRA FROM ABOVE, v2 ON, AND ENLARGED" />
      <Row>
        <SeatPlan id="orch.american" v2={false} w={big} title="orch.american · v2 off" />
        <SeatPlan id="orch.american" v2 w={big} title="orch.american · v2 ON" />
      </Row>
      <Row>
        <SeatPlan id="quartet.arc" v2={false} w={big} title="quartet violin 2 · v2 off, enlarged" zoom={{ cu: -330, cv: -100, mm: 900 }} />
        <SeatPlan id="quartet.arc" v2 w={big} title="quartet violin 2 · v2 ON, enlarged" zoom={{ cu: -330, cv: -100, mm: 900 }} />
      </Row>
      <Row>
        <SeatPlan id="quartet.arc" v2={false} w={big} title="quartet cello · v2 off, enlarged" zoom={{ cu: 1126, cv: 250, mm: 1500 }} />
        <SeatPlan id="quartet.arc" v2 w={big} title="quartet cello · v2 ON, enlarged" zoom={{ cu: 1126, cv: 250, mm: 1500 }} />
      </Row>
      </>) : null}
      {show('markers2') ? (<>
      <Head title="9b · PLAN MARKERS BEHIND `v2`: the clavinet, the hand-drum player, the standing marker" />
      <Row>
        <Pic title="CLAVINET · v2 off" cu={1350} cv={-1000} mmW={1400} mmH={1300} w={small * 1.6}><ClavinetPlan /></Pic>
        <Pic title="CLAVINET · v2 ON" cu={1350} cv={-1000} mmW={1400} mmH={1300} w={small * 1.6}><ClavinetPlan v2 /></Pic>
        <Pic title="CLAVINET · v2 ON, enlarged" cu={1250} cv={-1000} mmW={600} mmH={700} w={big}><ClavinetPlan v2 /></Pic>
      </Row>
      <Row>
        {(['guitar', 'bass', 'steel'] as const).map((k) => (
          <Pic key={k} title={`BACKLINE ${k} · v2 ON, enlarged (the steel's body: a plain box here)`} cu={150} cv={k === 'steel' ? 0 : -200} mmW={k === 'steel' ? 900 : 900} mmH={k === 'steel' ? 900 : 1300} w={small * 2}>
            <Group>
              {k === 'steel' ? <PlanPlayerTop pose={k} v2 part="lower" /> : null}
              {k === 'steel' ? <Rect x={300} y={-450} width={200} height={900} color="#8a5a24" /> : <PlanInstrumentEdge bass={k === 'bass'} />}
              <PlanPlayerTop pose={k} v2 part={k === 'steel' ? 'upper' : 'all'} />
            </Group>
          </Pic>
        ))}
      </Row>
      <Row>
        <Pic title="HAND DRUMS · the player (two heads Ø 280 drawn for reference)" cu={150} cv={0} mmW={900} mmH={800} w={big}>
          <Group>
            <SkCircle cx={400} cy={150} r={140} color="#4a3a2c" />
            <SkCircle cx={400} cy={-150} r={140} color="#4a3a2c" />
            <PlayerTopV2 player={handDrumPlayer(0, 0)} who={CAST.kofi} />
          </Group>
        </Pic>
        {ALL.map((id) => (
          <Pic key={id} title={`STANDING MARKER · ${CAST[id].name}`} cu={0} cv={0} mmW={640} mmH={560} w={small}>
            <MarkerTopV2 who={CAST[id]} />
          </Pic>
        ))}
      </Row>
      </>) : null}
      {show('sound') ? (<>
      <Head title="8 · SOUND SYSTEMS, THE LAB'S OWN DRAWINGS, LARGE" note="The real components: the venue plot with its performers (Ana center, Kofi and Ruth at the sides, the drummer on the riser) and the feedback loop (Ana at the mic)." />
      <View style={{ width: Math.min(width - 24, 900) }}>
        <VenueView performers a11y="study" />
      </View>
      <View style={{ width: Math.min(width - 24, 900), marginTop: 12 }}>
        <FeedbackLoop wedge="null" ringing={false} sendDb={-12} />
      </View>
      </>) : null}
      {show('cutaway') ? (<>
      <Head title="4 · THE VOICE CUT-AWAY (E01, E03: Ana · B01, B06, B07: Kofi · B02: Kofi in his jacket)" note="The outline of the head, neck and shoulders is now the person's approved side view; every part inside (airway, folds, tongue, spine) is where it was. Lesson size (the glass ≈ 360 × 250), then enlarged." />
      <Row>
        <Pic title="OLD (lessons not converted)" cu={-7} cv={72} mmW={675} mmH={545} w={small * 1.5}>
          <VoiceCutaway tint={TINT} />
        </Pic>
        <Pic title="BEFORE · Ana (the old outline, dressed)" cu={-7} cv={72} mmW={675} mmH={545} w={small * 1.5}>
          <OldVoiceCutaway tint={TINT} who={CAST.ana} />
        </Pic>
        <Pic title="BEFORE · Kofi in his jacket" cu={-7} cv={72} mmW={675} mmH={545} w={small * 1.5}>
          <OldVoiceCutaway tint={TINT} who={CAST.kofi} jacket />
        </Pic>
        {(['ana', 'kofi'] as CastId[]).map((id) => (
          <Pic key={id} title={`NEW · ${CAST[id].name}`} cu={-7} cv={72} mmW={675} mmH={545} w={small * 1.5}>
            <VoiceCutaway tint={TINT} who={CAST[id]} />
          </Pic>
        ))}
        <Pic title="NEW · Kofi in his jacket (B02)" cu={-7} cv={72} mmW={675} mmH={545} w={small * 1.5}>
          <VoiceCutaway tint={TINT} who={CAST.kofi} jacket />
        </Pic>
      </Row>
      <Row>
        {(['ana', 'kofi'] as CastId[]).map((id) => (
          <Pic key={id} title={`NEW · ${CAST[id].name} · enlarged`} cu={-90} cv={20} mmW={330} mmH={420} w={big}>
            <VoiceCutaway tint={NO_TINT} who={CAST[id]} />
          </Pic>
        ))}
        <Pic title="NEW · Kofi in his jacket · enlarged" cu={-90} cv={20} mmW={330} mmH={420} w={big}>
          <VoiceCutaway tint={NO_TINT} who={CAST.kofi} jacket />
        </Pic>
      </Row>

      </>) : null}
      {show('band') ? (<>
      <Head title="3 · THE GUITARIST AND BASSIST FROM ABOVE (Speaker Coverage)" note="Ruth on guitar, Kofi on bass: the fretting hand closed round the neck, the picking hand over the strings. Facing the right; the neck runs up the picture." />
      <Row>
        {(['guitar', 'bass'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row' }}>
            <Pic title={`OLD ${k}`} cu={60} cv={-200} mmW={900} mmH={1300} w={small}>
              <OldBand kind={k} />
            </Pic>
            <Pic title={`NEW ${k}`} cu={60} cv={-200} mmW={900} mmH={1300} w={small}>
              <NewBand kind={k} />
            </Pic>
          </View>
        ))}
      </Row>
      <Row>
        {(['guitar', 'bass'] as const).map((k) => (
          <Pic key={k} title={`NEW ${k} · enlarged`} cu={60} cv={-200} mmW={800} mmH={1200} w={big}>
            <NewBand kind={k} />
          </Pic>
        ))}
      </Row>
      <Row>
        {(['guitar', 'bass'] as const).flatMap((k) => [
          <Pic key={`f${k}`} title={`NEW ${k} · fretting hand`} cu={BAND_TOP_PLAYERS[k].L.at.u} cv={BAND_TOP_PLAYERS[k].L.at.v} mmW={300} mmH={300} w={Math.min(big, 260)}>
            <NewBand kind={k} />
          </Pic>,
          <Pic key={`p${k}`} title={`NEW ${k} · picking hand`} cu={BAND_TOP_PLAYERS[k].R.at.u} cv={BAND_TOP_PLAYERS[k].R.at.v} mmW={300} mmH={300} w={Math.min(big, 260)}>
            <NewBand kind={k} />
          </Pic>,
        ])}
      </Row>
      </>) : null}
    </View>
  );
}
