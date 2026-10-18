/**
 * cables — how a cable is drawn between two sockets: its plug over each
 * socket, its own lane between (house rule D69: every cable traceable, in
 * parallel lanes, never merged), a pattern AND a label as well as a colour
 * (accessibility), and a glow only while the renderer says audio is flowing
 * along that exact route.
 */
import { Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import type { CableKind } from '../model/djModel';
import { INK } from './ink';
import { Cable, PlugFace, type CableStyle } from './parts';
import { SceneText } from './sceneText';

export type Run = {
  id: string;
  kind: CableKind;
  /** Plug colour (RCA white/red) or jacket. */
  colour: string;
  /** Path through the lane (mm), first point = the fixed end. */
  pts: [number, number][];
  /** The far end is plugged in. */
  plugged: boolean;
  /** Audio flows along it now. */
  live: boolean;
  label: string;
  /** Dash pattern for the second conductor of a pair (pattern + colour). */
  dashed?: boolean;
};

const WIDTH: Record<CableKind, number> = { rca: 3.2, xlr: 4.6, trs: 4.2, phones: 3, iec: 5.6 };

export function styleOf(r: Run): CableStyle {
  const jacket = r.kind === 'rca' ? (r.colour === INK.rcaRed ? '#6e1d17' : '#5b5d63') : r.kind === 'iec' ? '#0e0e10' : INK.cableBlack;
  return { colour: jacket, width: WIDTH[r.kind], dash: r.dashed ? [5, 3.5] : undefined };
}

/** One cable run with its plugs and its label. */
export function CableRun({ r, flow = true, labelAt }: { r: Run; flow?: boolean; labelAt?: [number, number] }) {
  const st = styleOf(r);
  const a = r.pts[0];
  const b = r.pts[r.pts.length - 1];
  const plugKind = r.kind === 'phones' ? 'trs' : r.kind;
  return (
    <Group>
      <Cable pts={r.pts} style={st} glow={r.live && flow ? (r.kind === 'iec' ? 'rgba(255,198,77,0.8)' : INK.blue) : null} />
      <PlugFace cx={a[0]} cy={a[1]} kind={plugKind} colour={r.colour} />
      {r.plugged ? (
        <PlugFace cx={b[0]} cy={b[1]} kind={plugKind} colour={r.colour} />
      ) : (
        // a loose end: the plug lying free, its pin showing
        <Group>
          <RoundedRect x={b[0] - 3.4} y={b[1] - 2} width={6.8} height={11} r={2} color={r.kind === 'rca' ? r.colour : '#2a2c31'} />
          <Circle cx={b[0]} cy={b[1] + 11.5} r={1.4} color={INK.metalHi} />
        </Group>
      )}
      {labelAt ? <SceneText x={labelAt[0]} y={labelAt[1]} size={7.5} text={r.label} color={r.live ? INK.blue : INK.print} face="label" align="center" minPt={9} /> : null}
    </Group>
  );
}
