/**
 * CableArtPreview — DEV-ONLY gallery for the `cableArt` Skia illustrations
 * (`localhost:8090/#cableartpreview`).
 *
 * Every object is shown at review size against the lab's own background, plus a
 * 1:1 strip at the size the objects actually render inside a scene — because
 * art that only reads when it is 4× too big has not solved anything.
 *
 * Not reachable from the app. Web + __DEV__ only, wired in App.tsx.
 */
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import {
  BundleCrossSection,
  Cable,
  CableTray,
  CiArtCanvas,
  Conduit,
  ConnectorEnd,
  FloorProtector,
  HorizontalManager,
  JHook,
  PatchFan,
  VerticalManager,
  VelcroWrap,
  ZipTie,
  ZipTieSide,
  catenary,
  type ConnectorKind,
} from './cableArt';

function Case({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={styles.case}>
      <Text style={styles.caseTitle}>{title}</Text>
      {note ? <Text style={styles.caseNote}>{note}</Text> : null}
      <View style={styles.caseBody}>{children}</View>
    </View>
  );
}

const CONNECTORS: ConnectorKind[] = ['xlr', 'trs', 'speakon', 'powercon', 'rj45', 'iec'];

export function CableArtPreview() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>CABLE ART — SKIA ILLUSTRATION SET</Text>
      <Text style={styles.sub}>Acceptance review surface. Objects must be nameable cold, at scene size.</Text>

      <Case title="A · CABLE — drape, diameter, jacket" note="Three tonal steps across the width; contact shadow; no straight strokes.">
        <CiArtCanvas w={340} vw={340} vh={150} accessibilityLabel="Cable drape samples">
          <Cable points={catenary({ x: 16, y: 34 }, { x: 324, y: 34 }, 22)} d={11} jacket="mic" />
          <Cable points={catenary({ x: 16, y: 74 }, { x: 324, y: 74 }, 14)} d={7} jacket="network" />
          <Cable points={catenary({ x: 16, y: 112 }, { x: 324, y: 112 }, 30)} d={17} jacket="power" matte />
        </CiArtCanvas>
        <Text style={styles.cap}>17u multicore · 11u mic line · 7u network — diameters are honest, not decorative</Text>
      </Case>

      <Case title="B · CABLE — a real routed run" note="Waypoints splined: bend radius, service loop, and a turn down a wall.">
        <CiArtCanvas w={340} vw={340} vh={170} accessibilityLabel="Routed cable run">
          <Cable
            points={[
              { x: 10, y: 26 },
              { x: 120, y: 30 },
              { x: 210, y: 52 },
              { x: 246, y: 96 },
              { x: 214, y: 132 },
              { x: 170, y: 140 },
              { x: 60, y: 144 },
            ]}
            d={12}
            jacket="line"
          />
        </CiArtCanvas>
      </Case>

      <Case title="C · ZIP TIE — the object, not a ring" note="Ratchet head with a recessed slot, ladder teeth, trimmed tail.">
        <View style={styles.row}>
          <View>
            <CiArtCanvas w={150} vw={150} vh={150} accessibilityLabel="Cable tie, correctly tensioned">
              <BundleCrossSection cx={75} cy={82} r={13} squeeze={0} />
              <ZipTie cx={75} cy={82} rx={34} ry={34} strap={5} tail="trimmed" />
            </CiArtCanvas>
            <Text style={styles.cap}>SECURE · trimmed flush</Text>
          </View>
          <View>
            <CiArtCanvas w={150} vw={150} vh={150} accessibilityLabel="Cable tie, over-tightened">
              <BundleCrossSection cx={75} cy={82} r={13} squeeze={0.85} />
              <ZipTie cx={75} cy={82} rx={27} ry={25} strap={5} tail="long" overTightened />
            </CiArtCanvas>
            <Text style={styles.cap}>OVER-TIGHT · bundle deformed, tail left long</Text>
          </View>
        </View>
      </Case>

      <Case title="C2 · ZIP TIE — side view, the teaching image" note="Head proud of the bundle, band bowed round it, tail cut flush.">
        <CiArtCanvas w={340} vw={340} vh={190} accessibilityLabel="Cable tie on a bundle, side view">
          {/* the bundle it is holding */}
          {[0, 1, 2].map((i) => (
            <Cable
              key={i}
              points={[{ x: 10, y: 52 + i * 11 }, { x: 120, y: 50 + i * 11 }, { x: 250, y: 53 + i * 11 }, { x: 332, y: 52 + i * 11 }]}
              d={11}
              jacket={(['mic', 'line', 'network'] as const)[i]}
              shadow={i === 2}
            />
          ))}
          <ZipTieSide cx={96} cy={63} halfH={19} strap={6} tail="trimmed" />
          <ZipTieSide cx={232} cy={63} halfH={19} strap={6} tail="long" headAt="bottom" />

          {/* Over-tightened: the run NECKS IN at the tie. The waist is the
              lesson — a red marker on an undeformed bundle teaches nothing. */}
          {[0, 1, 2].map((i) => {
            const y = 140 + i * 11;
            const pinch = (y - 151) * 0.45 + 151; // pull each cable toward the centreline
            return (
              <Cable
                key={`b${i}`}
                points={[
                  { x: 10, y },
                  { x: 108, y: y - 1 },
                  { x: 150, y: pinch },
                  { x: 178, y: pinch },
                  { x: 220, y: y + 1 },
                  { x: 332, y },
                ]}
                d={11}
                jacket={(['mic', 'line', 'network'] as const)[i]}
                shadow={i === 2}
              />
            );
          })}
          <ZipTieSide cx={164} cy={151} halfH={15} strap={6} tail="long" overTightened />
        </CiArtCanvas>
        <Text style={styles.cap}>trimmed flush · tail left long (snag + cut hazard) · over-tightened</Text>
      </Case>

      <Case
        title="C3 · RACK DRESSING — against the reference photos"
        note="Waterfall off the patch field, nesting radii, loom into a vertical manager, D-ring fingers, ties at regular intervals."
      >
        <CiArtCanvas w={340} vw={340} vh={210} accessibilityLabel="Dressed patch panel with waterfall and managers">
          {/* patch panel face */}
          <PatchFan x0={36} panelY={24} ports={12} pitch={7.5} loomY={62} exitX={302} dir={1} d={4} jacket="network" stack={3} />
          <HorizontalManager x={28} y={76} w={276} h={15} fingers={5} />
          <PatchFan x0={36} panelY={112} ports={12} pitch={7.5} loomY={150} exitX={302} dir={1} d={4} jacket="fiber" stack={3} />
          <HorizontalManager x={28} y={164} w={276} h={15} fingers={5} />
          <VerticalManager x={306} y={20} w={16} h={172} fingers={7} />
          {/* ties at regular intervals along each loom */}
          <ZipTieSide cx={216} cy={66} halfH={7} strap={2.4} tail="trimmed" />
          <ZipTieSide cx={262} cy={66} halfH={7} strap={2.4} tail="trimmed" />
          <ZipTieSide cx={216} cy={154} halfH={7} strap={2.4} tail="trimmed" />
          <ZipTieSide cx={262} cy={154} halfH={7} strap={2.4} tail="trimmed" />
        </CiArtCanvas>
        <Text style={styles.cap}>data + fiber kept on separate looms · every run into a manager · nothing across the equipment face</Text>
      </Case>

      <Case title="D · HOOK & LOOP WRAP" note="Fabric, wider, matte, no head — visibly a different product from a tie.">
        <CiArtCanvas w={150} vw={150} vh={150} accessibilityLabel="Hook and loop wrap">
          <BundleCrossSection cx={75} cy={82} r={13} squeeze={0.12} />
          <VelcroWrap cx={75} cy={82} rx={33} ry={33} band={9} />
        </CiArtCanvas>
      </Case>

      <Case title="E · TERMINATIONS — boot + body, never a bare line-end">
        <CiArtCanvas w={340} vw={340} vh={230} accessibilityLabel="Connector terminations">
          {CONNECTORS.map((k, i) => {
            const y = 24 + i * 36;
            return (
              <Fragment key={k}>
                <Cable points={[{ x: 8, y }, { x: 90, y: y + 2 }, { x: 150, y }]} d={10} jacket={i % 2 ? 'line' : 'mic'} shadow={false} />
                <ConnectorEnd kind={k} x={150} y={y} jacket={i % 2 ? 'line' : 'mic'} scale={1.05} />
              </Fragment>
            );
          })}
        </CiArtCanvas>
        <Text style={styles.cap}>XLR · TRS · speakON-type · powerCON-type · RJ45 · IEC — generic hardware, no trade dress</Text>
      </Case>

      <Case title="F · PATHWAY HARDWARE">
        <CiArtCanvas w={340} vw={340} vh={260} accessibilityLabel="Pathway hardware">
          <CableTray x={14} y={16} w={310} h={18} kind="ladder" />
          <CableTray x={14} y={70} w={310} h={18} kind="basket" />
          <Conduit x={14} y={128} w={310} d={16} />
          <JHook x={40} y={214} s={1.1} />
          <FloorProtector x={130} y={200} w={180} h={16} />
        </CiArtCanvas>
        <Text style={styles.cap}>ladder tray · basket tray · EMT with coupling · J-hook · floor protector</Text>
      </Case>

      <Case title="G · 1:1 SCENE SIZE — the real test" note="This is the size these objects render at inside a stage. If it stops reading here, it is not done.">
        <CiArtCanvas w={340} vw={360} vh={130} accessibilityLabel="Objects at true scene scale">
          <CableTray x={20} y={20} w={230} h={14} kind="ladder" />
          <Cable points={[{ x: 24, y: 29 }, { x: 130, y: 31.5 }, { x: 246, y: 29 }]} d={8} jacket="mic" shadow={false} />
          <Cable points={[{ x: 24, y: 37 }, { x: 130, y: 39.5 }, { x: 246, y: 37 }]} d={6} jacket="network" shadow={false} />
          {/* SIDE view of the tray ⇒ the SIDE tie. The cross-section tie in a
              side-on scene reads as an eyelet floating over the run. */}
          <ZipTieSide cx={90} cy={35} halfH={8} strap={2.8} tail="trimmed" />
          <ZipTieSide cx={190} cy={35} halfH={8} strap={2.8} tail="trimmed" />
          <Cable points={catenary({ x: 246, y: 33 }, { x: 330, y: 84 }, 12)} d={8} jacket="mic" />
          <ConnectorEnd kind="xlr" x={330} y={84} angle={28} scale={0.62} jacket="mic" />
          <FloorProtector x={40} y={100} w={120} h={11} />
        </CiArtCanvas>
      </Case>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0e' },
  content: { padding: 14, gap: 16 },
  h1: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.amber },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: -8 },
  case: { gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#121216', padding: 12 },
  caseTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.textPrimary },
  caseNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  caseBody: { marginTop: 4, alignItems: 'flex-start' },
  row: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  cap: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub, marginTop: 4 },
});
