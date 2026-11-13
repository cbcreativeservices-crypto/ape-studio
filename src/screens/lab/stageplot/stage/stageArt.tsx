/**
 * stageArt — every stage object as it is seen FROM ABOVE on the editor's
 * dark glass (must-do D60).
 *
 * Real objects where the app already draws them (house visual standard: no
 * primitive stand-ins): the standing figure from above (figureAboveSvg), and
 * the Cable Install plan's furniture (floorArt): the drum kit, the keyboard,
 * the combo amplifier, the DI box, the tripod microphone stand, the 2-way
 * floor wedge and the stage box. A kind the app has no top view for is drawn
 * with its PRINT SYMBOL (spSymbols `spPlacedShapes`, the same lines the
 * packet prints), in light ink on the dark glass.
 *
 * Which way things face. In the project, 0° = facing the audience (down the
 * page). The shared art was drawn for other plans, so each piece is turned to
 * that rule here, once:
 *   • the kit and the keyboard are turned half a turn: the drummer's stool
 *     and the keys are UPSTAGE, the player facing the audience (as the Cable
 *     Install stage plan turns them);
 *   • the wedge is turned half a turn: its grille faces the way the object
 *     faces, so a wedge set to face upstage points at its performer. The
 *     print symbol says the same: its wide side, the grille, is its front
 *     (spSymbols, fix round 2026-11-12).
 *   • the drum kit is a right-handed kit as the audience sees it: the hi-hat
 *     and the snare are on the drummer's left, the viewer's right, in the art
 *     and in the print symbol alike.
 * Drum fills and sidefills are print symbols here, so they turn exactly as
 * the packet prints them.
 *
 * A platform (riser) and a labeled box are the band's own sizes, drawn from
 * the stage fractions the project stores, so they agree with the deck at
 * every zoom.
 */
import { memo } from 'react';
import { Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { FigureAboveSvg, FIGURE_ABOVE_W_MM } from '../../../../features/lab/figureAboveSvg';
import { spPlacedShapes, spSymbol, type SpFill, type SpShape } from '../../../../features/stageplot/spSymbols';
import type { SpObject, SpProject } from '../../../../features/stageplot/spTypes';
import { fonts } from '../../../../theme/tokens';
import { DiBoxTop, DrumKitTop, GtrAmpTop, KeysTop, MicStandTop, StageBoxTop, WedgeTop } from '../../cableinstall/scenes/floorArt';

/** floorArt is drawn at 32 units to the meter. */
const FLOOR_UNITS = 32;
/** A figure is drawn this much wider than the person symbol's 0.6 m. */
const PERSON_ENLARGED = 1.2;
/** Light ink, the dark body of a symbol, and one mid tone. */
export const STAGE_INK = '#d9dce3';
const PAPER = '#1a1c21';
const TONE = '#69707d';

const FILL: Record<SpFill, string> = { none: 'none', paper: PAPER, ink: STAGE_INK, tone: TONE };

/** One print-symbol shape, in meters, inside a group scaled to the glass. */
function Shape({ s, sw }: { s: SpShape; sw: number }) {
  const dash = 'dash' in s && s.dash ? `${sw * 3.2} ${sw * 2.4}` : undefined;
  if (s.t === 'circle') return <Circle cx={s.cx} cy={s.cy} r={s.r} fill={FILL[s.fill ?? 'none']} stroke={STAGE_INK} strokeWidth={sw} strokeDasharray={dash} />;
  if (s.t === 'line') return <Line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={STAGE_INK} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />;
  if (s.t === 'poly') {
    const pts: string[] = [];
    for (let k = 0; k + 1 < s.pts.length; k += 2) pts.push(`${s.pts[k]},${s.pts[k + 1]}`);
    return s.closed ? (
      <Polygon points={pts.join(' ')} fill={FILL[s.fill ?? 'none']} stroke={STAGE_INK} strokeWidth={sw} strokeLinejoin="round" strokeDasharray={dash} />
    ) : (
      <Polyline points={pts.join(' ')} fill="none" stroke={STAGE_INK} strokeWidth={sw} strokeLinejoin="round" strokeDasharray={dash} />
    );
  }
  return <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={FILL[s.fill ?? 'none']} stroke={STAGE_INK} strokeWidth={sw} strokeDasharray={dash} />;
}

export type StageObjectArtProps = {
  p: SpProject;
  o: SpObject;
  /** Center on the glass, glass units. */
  cx: number;
  cy: number;
  /** Half width and half depth on the glass, before turning. */
  hw: number;
  hh: number;
  rot: number;
  /** Glass units per meter for symbols. */
  u: number;
  /** Drawn fainter (an object that is off the stage). */
  dim?: boolean;
};

function Art({ p, o, cx, cy, hw, hh, rot, u, dim }: StageObjectArtProps) {
  const at = `translate(${cx} ${cy})`;
  const k = u / FLOOR_UNITS;
  const opacity = dim ? 0.62 : 1;
  switch (o.kind) {
    case 'performer':
      // drawn a little wider than the print symbol (0.6 m × PERSON_ENLARGED),
      // over life size, so a person reads at phone size; a symbol is a
      // drawing, not a footprint, and the screen says so
      return (
        <G opacity={opacity}>
          <FigureAboveSvg x={cx} y={cy} pxPerMm={(u * spSymbol('performer').w * PERSON_ENLARGED) / FIGURE_ABOVE_W_MM} facingDeg={rot} halo="#c3cde2" />
        </G>
      );
    case 'drum-kit':
      return (
        <G transform={`${at} rotate(${rot + 180}) scale(${k * 1.3}) translate(0.8 2.6)`} opacity={opacity}>
          <DrumKitTop x={0} y={0} />
        </G>
      );
    case 'keyboard':
      return (
        <G transform={`${at} rotate(${rot + 180}) scale(${k})`} opacity={opacity}>
          <KeysTop x={-20.8} y={-5.8} w={41.6} h={11.6} />
        </G>
      );
    case 'guitar-amp':
      return (
        <G transform={`${at} rotate(${rot}) scale(${k})`} opacity={opacity}>
          <GtrAmpTop x={-11} y={-6} w={22} h={12} />
        </G>
      );
    case 'bass-amp':
      return (
        <G transform={`${at} rotate(${rot}) scale(${k})`} opacity={opacity}>
          <GtrAmpTop x={-12.8} y={-8} w={25.6} h={16} />
        </G>
      );
    case 'di':
      return (
        <G transform={`${at} rotate(${rot}) scale(${k * 1.15})`} opacity={opacity}>
          <DiBoxTop x={0} y={0} />
        </G>
      );
    case 'vocal-mic':
    case 'mic-stand':
      return (
        <G transform={`${at} rotate(${rot}) scale(${k})`} opacity={opacity}>
          <MicStandTop x={0} y={3.5} boom={0} reach={9} />
        </G>
      );
    case 'wedge':
      return (
        <G transform={`${at} rotate(${rot + 180}) scale(${k * 1.1})`} opacity={opacity}>
          <WedgeTop x={0} y={0} />
        </G>
      );
    case 'stage-box':
      return (
        <G transform={`${at} rotate(${rot}) scale(${k * 0.95})`} opacity={opacity}>
          <StageBoxTop x={-9} y={-6} />
        </G>
      );
    case 'riser':
      // a platform lying on the deck: a soft shadow, the top, a dashed edge
      return (
        <G transform={`${at} rotate(${rot})`} opacity={opacity}>
          <Rect x={-hw + 1.2} y={-hh + 1.8} width={hw * 2} height={hh * 2} rx={1.5} fill="rgba(0,0,0,0.5)" />
          <Rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={1.5} fill="#3b3025" stroke="#c9b48a" strokeWidth={1} strokeDasharray="5 3" />
          <Path d={`M${-hw + 2} ${-hh + 2} H${hw - 2}`} stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
        </G>
      );
    case 'generic':
      return (
        <G transform={`${at} rotate(${rot})`} opacity={opacity}>
          <Rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={2} fill={PAPER} stroke={STAGE_INK} strokeWidth={1.1} />
        </G>
      );
    default: {
      // the print symbol, turned by spPlacedShapes itself
      const shapes = spPlacedShapes(p, { ...o, x: 0, y: 0, rot });
      const tag = spSymbol(o.kind).tag;
      return (
        <G opacity={opacity}>
          <G transform={`${at} scale(${u})`}>
            {shapes.map((s, i) => (
              <Shape key={i} s={s} sw={1.15 / u} />
            ))}
          </G>
          {tag ? (
            <SvgText x={cx} y={cy + 3.2} fill={STAGE_INK} fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
              {tag}
            </SvgText>
          ) : null}
        </G>
      );
    }
  }
}

/** One object's drawing. Memoized: while one object is dragged, the others
 *  are not painted again. */
export const StageObjectArt = memo(Art);
