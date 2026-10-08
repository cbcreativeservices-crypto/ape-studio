/**
 * How each link of the measurement chains is drawn in the chain rack's
 * icon box (engine/chain/ChainRack.tsx `drawPart`). Real equipment at icon
 * size: the measurement mic (micDrawings), the power and input boxes, the
 * sound level meter, a calibration record, the omni source and a test
 * loudspeaker; the frequency weightings drawn from their defining formulas
 * (the A- and C-weighting curves of the sound level meter standard's
 * equations — the curve shape, not a measurement). Nothing moves.
 */
import type { ReactNode } from 'react';
import { Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { MeasurementMic, SoundLevelMeter, VocalDynamicMic } from '../../../../../../features/lab/micDrawings';
import type { DrawPart } from '../../../engine/chain/ChainRack';
import { ChainBox, OmniSource, TestSpeaker, make, rectP, type BoxKind } from './MeasureArt';

type Box = { x: number; y: number; w: number; h: number };

/** The A- and C-weighting gains (dB) at f Hz, from their defining formulas
 *  (normalised to 0 dB at 1 kHz). */
export function weightingDb(kind: 'A' | 'C' | 'Z', f: number): number {
  if (kind === 'Z') return 0;
  const f2 = f * f;
  const c1 = 20.6 ** 2;
  const c4 = 12194 ** 2;
  if (kind === 'C') {
    const rc = (c4 * f2) / ((f2 + c1) * (f2 + c4));
    return 20 * Math.log10(rc) + 0.06;
  }
  const ra = (c4 * f2 * f2) / ((f2 + c1) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + c4));
  return 20 * Math.log10(ra) + 2.0;
}

function curve(kind: 'A' | 'C' | 'Z', b: Box) {
  const p = make();
  const grid = make();
  const lo = Math.log10(20);
  const hi = Math.log10(20000);
  const yOf = (db: number) => b.y + b.h * 0.25 + (Math.max(-50, Math.min(5, -db)) / 55) * b.h * 0.7;
  for (let i = 0; i <= 60; i++) {
    const lf = lo + ((hi - lo) * i) / 60;
    const x = b.x + 4 + ((b.w - 8) * i) / 60;
    const y = yOf(weightingDb(kind, 10 ** lf));
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  grid.moveTo(b.x + 4, yOf(0));
  grid.lineTo(b.x + b.w - 4, yOf(0));
  const panel = rectP(make(), b.x, b.y, b.x + b.w, b.y + b.h, 6);
  return { p, grid, panel };
}

function Weighting({ kind, b }: { kind: 'A' | 'C' | 'Z'; b: Box }) {
  const c = curve(kind, b);
  return (
    <Group>
      <Path path={c.panel} color="#0e1215" />
      <Path path={c.grid} style="stroke" strokeWidth={1} color="#3a4048" />
      <Path path={c.p} style="stroke" strokeWidth={2} strokeCap="round" color="#7fd4ff" />
    </Group>
  );
}

function Sheet({ b, state }: { b: Box; state: 'own' | 'copied' | 'none' | 'log' }) {
  const w = Math.min(b.w * 0.55, b.h * 0.8);
  const x = b.x + (b.w - w) / 2;
  const page = rectP(make(), x, b.y, x + w, b.y + b.h, 3);
  const lines = make();
  if (state !== 'none') for (let i = 1; i <= 5; i++) {
    lines.moveTo(x + w * 0.14, b.y + (b.h * i) / 7);
    lines.lineTo(x + w * (i % 2 ? 0.86 : 0.7), b.y + (b.h * i) / 7);
  }
  return (
    <Group>
      <Path path={page} color={state === 'none' ? '#1a1b1f' : '#d9d6cc'} opacity={state === 'none' ? 1 : 0.92} />
      <Path path={page} style="stroke" strokeWidth={1.2} color={state === 'none' ? '#5c6068' : '#07080a'} />
      <Path path={lines} style="stroke" strokeWidth={1.4} color="#4b4a45" />
      {state === 'own' ? <Circle cx={x + w * 0.74} cy={b.y + b.h * 0.8} r={Math.min(w, b.h) * 0.13} color="#c0392b" opacity={0.85} /> : null}
      {state === 'copied' ? <Circle cx={x + w * 0.74} cy={b.y + b.h * 0.8} r={Math.min(w, b.h) * 0.13} style="stroke" strokeWidth={1.5} color="#9a7a2a" /> : null}
    </Group>
  );
}

function Phone({ b }: { b: Box }) {
  const w = Math.min(b.w * 0.3, b.h * 0.55);
  const x = b.x + (b.w - w) / 2;
  const body = rectP(make(), x, b.y, x + w, b.y + b.h, w * 0.18);
  const screen = rectP(make(), x + w * 0.1, b.y + b.h * 0.08, x + w * 0.9, b.y + b.h * 0.9, w * 0.08);
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(x, b.y)} end={vec(x + w, b.y + b.h)} colors={['#4a4e57', '#1d1f24']} />
      </Path>
      <Path path={screen} color="#0f1720" />
      <Path path={body} style="stroke" strokeWidth={1.2} color="#07080a" />
    </Group>
  );
}

function NoMark({ b }: { b: Box }) {
  const r = Math.min(b.w, b.h) * 0.4;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const slash = Skia.Path.Make();
  slash.moveTo(cx - r * 0.7, cy - r * 0.7);
  slash.lineTo(cx + r * 0.7, cy + r * 0.7);
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={3} color="#ff6b5e" />
      <Path path={slash} style="stroke" strokeWidth={3} color="#ff6b5e" />
    </Group>
  );
}

/** A horizontal measurement mic in the box (front at the left). */
function MicIn({ b, quarter }: { b: Box; quarter?: boolean }) {
  const len = b.w * 0.9;
  const r = Math.min(b.h * 0.2, len * (quarter ? 0.025 : 0.04));
  return (
    <Group transform={[{ translateX: b.x + b.w * 0.05 }, { translateY: b.y + b.h / 2 }, { rotate: -Math.PI / 2 }]}>
      <MeasurementMic r={r} len={len} />
    </Group>
  );
}

const box = (kind: BoxKind, b: Box, tint?: string): ReactNode => <ChainBox kind={kind} x={b.x + b.w * 0.15} y={b.y} w={b.w * 0.7} h={b.h} tint={tint} />;

export const drawMeasurePart: DrawPart = (slot, part, b) => {
  switch (`${slot}:${part}`) {
    case 'capsule:prepol':
    case 'capsule:extpol':
    case 'mic:meas':
      return <MicIn b={b} />;
    case 'mic:vocal': {
      const r = b.h * 0.26;
      return (
        <Group transform={[{ translateX: b.x + b.w * 0.18 }, { translateY: b.y + b.h / 2 }, { rotate: -Math.PI / 2 }]}>
          <VocalDynamicMic r={r} len={b.w * 0.62} />
        </Group>
      );
    }
    case 'power:polsupply':
      return box('polarization', b);
    case 'power:ccp':
      return box('ccp', b);
    case 'power:approved':
      return box('ccp', b, '#ffc64d');
    case 'power:phantom':
      return box('phantom', b, '#ff6b5e');
    case 'input:analyzer':
      return box('analyzer', b);
    case 'input:interface':
      return box('meter', b);
    case 'input:recorder':
    case 'instrument:recorder':
      return box('recorder', b);
    case 'record:own':
      return <Sheet b={b} state="own" />;
    case 'record:copied':
      return <Sheet b={b} state="copied" />;
    case 'record:none':
      return <Sheet b={b} state="none" />;
    case 'instrument:slm': {
      const len = b.h * 0.92;
      return (
        <Group transform={[{ translateX: b.x + b.w / 2 }, { translateY: b.y + b.h * 0.06 }]}>
          <SoundLevelMeter r={len * 0.12} len={len} />
        </Group>
      );
    }
    case 'instrument:phone':
      return <Phone b={b} />;
    case 'weighting:A':
    case 'weighting:C':
    case 'weighting:Z':
      return <Weighting kind={part as 'A' | 'C' | 'Z'} b={b} />;
    case 'time:eq':
    case 'time:F':
    case 'time:S':
    case 'time:peak':
      return box('meter', b);
    case 'report:laeq':
    case 'report:lafmax':
    case 'report:lcpeak':
      return <Sheet b={b} state="log" />;
    case 'report:db':
      return <Sheet b={b} state="none" />;
    case 'signal:sweep':
    case 'signal:noise':
      return box('analyzer', b);
    case 'signal:clap':
      return box('recorder', b, '#ffc64d');
    case 'signal:blank':
      return <NoMark b={b} />;
    case 'source:omni':
      return <OmniSource cu={b.x + b.w / 2} cv={b.y + b.h / 2} r={b.h * 0.42} floorV={null} />;
    case 'source:pa': {
      const s = b.h / 420;
      return (
        <Group transform={[{ translateX: b.x + b.w / 2 + 110 * s }, { translateY: b.y + b.h * 0.52 }, { scale: s }]}>
          <TestSpeaker g={{ front: 0, depth: 250, top: -210, bottom: 190, half: 125, woofer: { y: 60, r: 82 }, tweeter: { y: -130, r: 20 }, floorY: 0, stand: false }} view="side" />
        </Group>
      );
    }
    case 'processing:off':
      return box('phantom', b, '#5bff85');
    case 'processing:on':
      return box('phantom', b, '#ff6b5e');
    case 'response:freeField':
    case 'response:pressure':
    case 'response:random':
      return <MicIn b={b} />;
    case 'aim:at':
    case 'aim:data':
      return <MicIn b={b} />;
    case 'aim:side': {
      const len = b.h * 0.95;
      return (
        <Group transform={[{ translateX: b.x + b.w / 2 }, { translateY: b.y + b.h * 0.03 }]}>
          <MeasurementMic r={Math.min(b.w * 0.05, len * 0.04)} len={len} />
        </Group>
      );
    }
    default:
      return null;
  }
};
