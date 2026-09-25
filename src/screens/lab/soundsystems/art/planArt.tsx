/**
 * Sound Systems Lab — PLAN-VIEW glyphs for the venue plot.
 *
 * The plot is a top-down stage plan, so every object on it is drawn as a
 * technician sees it on a production drawing: the top face of a cabinet,
 * wider at the front than the back (a trapezoidal box IS wider at the
 * front), rotated to its aim; a wedge as a sloped top; a desk with its
 * fader ticks; a rack lid. The front elevations in gearArt stay for the
 * parts bin, the inspect card and the system map — this set is for the
 * plot only.
 *
 * Every glyph is drawn in a 64-box facing +y (down the plot, into the
 * audience) and rotated by `rotateDeg` about its centre. Pure react-native-svg;
 * gradient ids are prefixed per instance.
 */
import { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../../theme/tokens';
import type { GearKind } from '../../../../features/soundsystems/types';
import { INK } from './gearArt';

export type PlanRig = 'stack' | 'flown' | 'pole';

function PlanDefs({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={`${id}-lid`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#3b4048" />
        <Stop offset="1" stopColor="#15171b" />
      </LinearGradient>
      <LinearGradient id={`${id}-slope`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#454b55" />
        <Stop offset="1" stopColor="#111317" />
      </LinearGradient>
      <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={INK.metalHi} />
        <Stop offset="1" stopColor={INK.metalLo} />
      </LinearGradient>
    </Defs>
  );
}

/** A top cabinet from above: trapezoid, back narrower than the front,
 *  grille band along the front edge, handle slots on the sides. */
function PlanTop({ id, lit, rig }: { id: string; lit: boolean; rig: PlanRig }) {
  const flown = rig === 'flown';
  return (
    <G>
      {flown ? (
        <>
          {/* the overhead convention: dashed outline offset, rigging points */}
          <Polygon points="18,14 46,14 51,50 13,50" fill="none" stroke={INK.metalHi} strokeWidth={0.9} strokeDasharray="2 2" opacity={0.7} />
          <Circle cx={21} cy={17} r={2} fill="none" stroke={INK.metalHi} strokeWidth={0.9} />
          <Circle cx={43} cy={17} r={2} fill="none" stroke={INK.metalHi} strokeWidth={0.9} />
        </>
      ) : (
        <Ellipse cx={32} cy={52} rx={20} ry={4} fill="#000" opacity={0.35} />
      )}
      <Polygon points="21,18 43,18 48,48 16,48" fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.7} />
      <Line x1={21.6} y1={18.6} x2={42.4} y2={18.6} stroke="#fff" strokeWidth={0.8} opacity={0.18} />
      <Line x1={21.4} y1={18.8} x2={16.6} y2={47.4} stroke="#fff" strokeWidth={0.6} opacity={0.12} />
      {/* the grille frame along the front edge */}
      <Rect x={16.5} y={44.5} width={31} height={3.5} fill="#0b0c0f" />
      <Line x1={18} y1={46.2} x2={46} y2={46.2} stroke="#3a3f47" strokeWidth={0.7} />
      {/* handle slots */}
      <Ellipse cx={19.6} cy={33} rx={1.2} ry={3.2} fill="#0b0c0f" />
      <Ellipse cx={44.4} cy={33} rx={1.2} ry={3.2} fill="#0b0c0f" />
      {lit ? <Circle cx={32} cy={22} r={1.4} fill={INK.blue} /> : <Circle cx={32} cy={22} r={1.2} fill="#2a2d33" />}
      {rig === 'pole' ? <Circle cx={32} cy={34} r={2.2} fill="none" stroke="#000" strokeWidth={0.8} /> : null}
    </G>
  );
}

/** A subwoofer from above: a wide low box, one centre handle. */
function PlanSub({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      <Ellipse cx={32} cy={50} rx={22} ry={4} fill="#000" opacity={0.35} />
      <Rect x={10} y={20} width={44} height={28} rx={2} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.7} />
      <Line x1={10.8} y1={20.8} x2={53.2} y2={20.8} stroke="#fff" strokeWidth={0.8} opacity={0.18} />
      <Rect x={10.5} y={44.5} width={43} height={3.5} fill="#0b0c0f" />
      <Ellipse cx={32} cy={30} rx={4} ry={1.4} fill="#0b0c0f" />
      {[12, 50].map((x) => (
        <Rect key={x} x={x - 2} y={20} width={4} height={4} rx={1} fill={INK.metalLo} />
      ))}
      {lit ? <Circle cx={48} cy={25} r={1.4} fill={INK.blue} /> : null}
    </G>
  );
}

/** A floor wedge from above: the sloped top reads by its shading — light at
 *  the tall back edge, dark at the low front lip, a horn slot on the face. */
function PlanWedge({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      <Ellipse cx={32} cy={48} rx={16} ry={3} fill="#000" opacity={0.35} />
      <Polygon points="19,16 45,16 43,46 21,46" fill={`url(#${id}-slope)`} stroke="#000" strokeWidth={0.7} />
      <Line x1={19.6} y1={16.6} x2={44.4} y2={16.6} stroke="#fff" strokeWidth={0.9} opacity={0.22} />
      <Rect x={26} y={34} width={12} height={4} rx={1} fill="#0b0c0f" />
      <Rect x={20.5} y={44} width={23} height={2.4} fill="#0b0c0f" />
      {lit ? <Circle cx={40} cy={20} r={1.2} fill={INK.blue} /> : null}
    </G>
  );
}

/** The front-of-house desk from above. */
function PlanFoh({ id }: { id: string }) {
  return (
    <G>
      <Rect x={10} y={22} width={44} height={22} rx={2} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.7} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Rect key={i} x={14 + i * 4.3} y={26} width={1.2} height={12} rx={0.6} fill="#08090b" />
      ))}
      <Rect x={13.4} y={31} width={2.4} height={2} fill={colors.amber} />
      <Rect x={26.3} y={29} width={2.4} height={2} fill={colors.amber} />
      <Rect x={47} y={25} width={5} height={7} rx={0.8} fill="#0a1a2a" stroke="#1f3a55" strokeWidth={0.5} />
      <Rect x={47.6} y={34} width={1.2} height={8} rx={0.6} fill="#08090b" />
      <Rect x={46.8} y={36} width={2.8} height={2} fill={colors.red} />
    </G>
  );
}

/** A rack from above: the lid with two latches and a power LED. */
function PlanRack({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      <Rect x={16} y={16} width={32} height={32} rx={3} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.7} />
      <Line x1={17} y1={17} x2={47} y2={17} stroke="#fff" strokeWidth={0.8} opacity={0.16} />
      <Circle cx={22} cy={44} r={1.5} fill="#0b0c0f" />
      <Circle cx={42} cy={44} r={1.5} fill="#0b0c0f" />
      <Rect x={22} y={22} width={20} height={14} rx={1} fill="#0b0c0f" opacity={0.5} />
      {lit ? <Circle cx={42} cy={20} r={1.4} fill={INK.blue} /> : <Circle cx={42} cy={20} r={1.2} fill="#2a2d33" />}
    </G>
  );
}

/** A microphone on its stand from above: the base disc, the boom, the capsule. */
function PlanMic({ id }: { id: string }) {
  return (
    <G>
      <Circle cx={30} cy={36} r={9} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.6} />
      <Circle cx={30} cy={36} r={2} fill="#0b0c0f" />
      <Line x1={30} y1={36} x2={38} y2={48} stroke={INK.metalMid} strokeWidth={2.2} strokeLinecap="round" />
      <Ellipse cx={39.5} cy={50} rx={4} ry={3} fill="#8a9097" stroke="#0b0c0f" strokeWidth={0.6} />
    </G>
  );
}

function PlanSmallBox({ id, w, h, led }: { id: string; w: number; h: number; led?: string }) {
  return (
    <G>
      <Rect x={32 - w / 2} y={32 - h / 2} width={w} height={h} rx={1.5} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.6} />
      {led ? <Circle cx={32 + w / 2 - 3} cy={32 - h / 2 + 3} r={1.3} fill={led} /> : null}
    </G>
  );
}

function PlanStagebox({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      <Rect x={12} y={20} width={40} height={26} rx={2} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.7} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Circle key={i} cx={17 + i * 5.2} cy={28} r={1.7} fill="#0b0c0f" stroke={INK.metalHi} strokeWidth={0.5} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Circle key={i} cx={17 + i * 5.2} cy={36} r={1.7} fill="#0b0c0f" stroke={INK.metalHi} strokeWidth={0.5} />
      ))}
      <Circle cx={43} cy={36} r={1.7} fill="#0b0c0f" stroke={colors.amber} strokeWidth={0.6} />
      <Circle cx={48} cy={36} r={1.7} fill="#0b0c0f" stroke={colors.amber} strokeWidth={0.6} />
      <Rect x={41} y={25} width={8} height={5} rx={0.8} fill="#0b0c0f" stroke={INK.metalHi} strokeWidth={0.5} />
      <Circle cx={48} cy={42.5} r={1.4} fill={lit ? INK.blue : '#2a2d33'} />
    </G>
  );
}

function PlanDistro({ id }: { id: string }) {
  return (
    <G>
      <Rect x={16} y={22} width={32} height={20} rx={1.5} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={19 + i * 7} y={30} width={4.4} height={5} rx={0.8} fill="#0b0c0f" stroke={INK.metalHi} strokeWidth={0.4} />
      ))}
      <Circle cx={44} cy={25.5} r={1.3} fill={INK.green} />
    </G>
  );
}

function PlanSnake({ id }: { id: string }) {
  return (
    <G>
      <Rect x={12} y={26} width={26} height={14} rx={1.5} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.6} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Circle key={i} cx={16 + i * 4.6} cy={33} r={1.4} fill="#0b0c0f" stroke={INK.metalHi} strokeWidth={0.4} />
      ))}
      <Path d="M 38 33 C 46 33 50 26 46 22 C 42 18 36 22 40 26" stroke="#2f7f9f" strokeWidth={3.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

export type PlanKind = GearKind;

function Drawing({ kind, id, lit, rig }: { kind: PlanKind; id: string; lit: boolean; rig: PlanRig }) {
  switch (kind) {
    case 'poweredSpeaker':
    case 'passiveSpeaker':
      return <PlanTop id={id} lit={lit && kind === 'poweredSpeaker'} rig={rig} />;
    case 'poweredSub':
    case 'passiveSub':
      return <PlanSub id={id} lit={lit && kind === 'poweredSub'} />;
    case 'wedge':
    case 'poweredWedge':
      return <PlanWedge id={id} lit={lit && kind === 'poweredWedge'} />;
    case 'console':
      return <PlanFoh id={id} />;
    case 'amp':
    case 'processor':
    case 'iemTx':
      return <PlanRack id={id} lit={lit} />;
    case 'vocalMic':
    case 'instrumentMic':
      return <PlanMic id={id} />;
    case 'stagebox':
      return <PlanStagebox id={id} lit={lit} />;
    case 'snake':
      return <PlanSnake id={id} />;
    case 'powerDistro':
      return <PlanDistro id={id} />;
    case 'di':
      return <PlanSmallBox id={id} w={14} h={10} led={lit ? INK.green : undefined} />;
    case 'playback':
      return <PlanSmallBox id={id} w={18} h={12} led={lit ? INK.blue : undefined} />;
    case 'wirelessRx':
      return (
        <G>
          <PlanSmallBox id={id} w={20} h={10} led={lit ? INK.blue : undefined} />
          <Line x1={23} y1={27} x2={19} y2={19} stroke={INK.metalHi} strokeWidth={1.2} strokeLinecap="round" />
          <Line x1={41} y1={27} x2={45} y2={19} stroke={INK.metalHi} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      );
    case 'iemPack':
      return <PlanSmallBox id={id} w={10} h={13} led={lit ? INK.green : undefined} />;
  }
}

/** Size, in plot units, at which each kind reads at the plot's scale. */
export function planSize(kind: PlanKind): number {
  switch (kind) {
    case 'poweredSpeaker':
    case 'passiveSpeaker':
      return 30;
    case 'poweredSub':
    case 'passiveSub':
      return 28;
    case 'wedge':
    case 'poweredWedge':
      return 20;
    case 'console':
      return 34;
    case 'stagebox':
      return 26;
    case 'amp':
    case 'processor':
    case 'iemTx':
      return 22;
    default:
      return 22;
  }
}

/** A plan glyph placed inside the plot's <Svg>, rotated to `rotateDeg`
 *  (0 = facing down the plot). `id` must be unique in the root. */
export function PlanGlyph({ kind, id, x, y, rotateDeg = 0, size, dim, lit = true, rig = 'stack', highlight }: { kind: PlanKind; id: string; x: number; y: number; rotateDeg?: number; size?: number; dim?: boolean; lit?: boolean; rig?: PlanRig; highlight?: string }) {
  const sz = size ?? planSize(kind);
  const s = sz / 64;
  return (
    <G>
      <PlanDefs id={id} />
      {highlight ? <Circle cx={x} cy={y} r={sz * 0.62} fill={highlight} opacity={0.14} /> : null}
      {highlight ? <Circle cx={x} cy={y} r={sz * 0.62} fill="none" stroke={highlight} strokeWidth={1.2} opacity={0.85} /> : null}
      <G transform={`translate(${x}, ${y}) rotate(${-rotateDeg}) translate(${-sz / 2}, ${-sz / 2}) scale(${s})`} opacity={dim ? 0.45 : 1}>
        <Drawing kind={kind} id={id} lit={lit} rig={rig} />
      </G>
    </G>
  );
}
