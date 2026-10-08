/**
 * How each link of Lab 6 group 5's chains (chainsSystems.ts) is drawn in
 * the chain rack's icon box — real equipment at icon size: the console and
 * the processor with the reference tap marked, the measurement and vocal
 * mics, the analyzer, the PA cabinet, the recorder, the contact sensor, the
 * log sheet. Anything group 4's drawing already covers is drawn by it
 * (partArt.drawMeasurePart), never redrawn. Nothing moves.
 */
import { Circle, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import type { DrawPart } from '../../../engine/chain/ChainRack';
import { MeasurementMic, VocalDynamicMic } from '../../../../../../features/lab/micDrawings';
import { ChainBox } from './MeasureArt';
import { ContactSensor } from './SensorArt';
import { drawMeasurePart } from './partArt';

type Box = { x: number; y: number; w: number; h: number };

/** The console and the processor side by side, a cable between them, the tap marked before or after the processor. */
function TapIcon({ b, at }: { b: Box; at: 'pre' | 'post' }) {
  const bw = b.w * 0.36;
  const y = b.y + b.h * 0.12;
  const h = b.h * 0.76;
  const x1 = b.x + b.w * 0.04;
  const x2 = b.x + b.w * 0.6;
  const tapX = at === 'pre' ? (x1 + bw + x2) / 2 : x2 + bw + b.w * 0.02;
  return (
    <Group>
      <ChainBox kind="meter" x={x1} y={y} w={bw} h={h} />
      <ChainBox kind="ccp" x={x2} y={y} w={bw} h={h} tint={at === 'post' ? '#ffc64d' : undefined} />
      <Line p1={vec(x1 + bw, y + h / 2)} p2={vec(x2, y + h / 2)} color="#3c3f47" strokeWidth={3} />
      <Circle cx={tapX} cy={y + h / 2} r={Math.min(5, b.h * 0.1)} color="#ffc64d" />
      <Line p1={vec(tapX, y + h / 2)} p2={vec(tapX, b.y + b.h)} color="#ffc64d" strokeWidth={1.6} />
    </Group>
  );
}

/** Two mics stacked (a matched pair, or an omni beside a directional). */
function PairIcon({ b, mixed }: { b: Box; mixed: boolean }) {
  const len = b.w * 0.8;
  const r = Math.min(b.h * 0.12, len * 0.04);
  return (
    <Group>
      <Group transform={[{ translateX: b.x + b.w * 0.08 }, { translateY: b.y + b.h * 0.28 }, { rotate: -Math.PI / 2 }]}>
        <MeasurementMic r={r} len={len} />
      </Group>
      {mixed ? (
        <Group transform={[{ translateX: b.x + b.w * 0.2 }, { translateY: b.y + b.h * 0.74 }, { rotate: -Math.PI / 2 }]}>
          <VocalDynamicMic r={b.h * 0.16} len={b.w * 0.55} />
        </Group>
      ) : (
        <Group transform={[{ translateX: b.x + b.w * 0.08 }, { translateY: b.y + b.h * 0.72 }, { rotate: -Math.PI / 2 }]}>
          <MeasurementMic r={r} len={len} />
        </Group>
      )}
    </Group>
  );
}

function TwoRecorders({ b }: { b: Box }) {
  const w = b.w * 0.4;
  return (
    <Group>
      <ChainBox kind="recorder" x={b.x + b.w * 0.06} y={b.y + b.h * 0.1} w={w} h={b.h * 0.8} />
      <ChainBox kind="recorder" x={b.x + b.w * 0.54} y={b.y + b.h * 0.1} w={w} h={b.h * 0.8} tint="#ff6b5e" />
    </Group>
  );
}

function SensorIcon({ b, warn }: { b: Box; warn: boolean }) {
  const s = b.h * 0.7;
  const surface = Skia.Path.Make();
  surface.addRect(Skia.XYWHRect(b.x + b.w * 0.1, b.y + b.h * 0.86, b.w * 0.8, b.h * 0.1));
  return (
    <Group>
      <Path path={surface} color="#4a4e57" />
      <ContactSensor x={b.x + b.w * 0.4} y={b.y + b.h * 0.86} s={s} warn={warn} />
    </Group>
  );
}

export const drawSystemPart: DrawPart = (slot, part, b) => {
  switch (`${slot}:${part}`) {
    case 'reference:pre':
      return <TapIcon b={b} at="pre" />;
    case 'reference:post':
      return <TapIcon b={b} at="post" />;
    case 'reference:none':
    case 'air:none':
    case 'vib:none':
      return drawMeasurePart('signal', 'blank', b);
    case 'mic:meas':
    case 'air:meas':
      return drawMeasurePart('mic', 'meas', b);
    case 'mic:vocal':
    case 'air:dir':
      return drawMeasurePart('mic', 'vocal', b);
    case 'route:analyzer':
      return drawMeasurePart('input', 'analyzer', b);
    case 'route:console':
      return drawMeasurePart('source', 'pa', b);
    case 'processing:fixed':
    case 'gain:fixed':
    case 'processing:raw':
      return drawMeasurePart('processing', 'off', b);
    case 'processing:auto':
    case 'gain:auto':
    case 'processing:aligned':
      return drawMeasurePart('processing', 'on', b);
    case 'vib:contact':
      return <SensorIcon b={b} warn={false} />;
    case 'vib:hand':
      return <SensorIcon b={b} warn />;
    case 'claim:relative':
    case 'claim:clues':
    case 'geometry:logged':
      return drawMeasurePart('report', 'laeq', b);
    case 'claim:spl':
    case 'claim:power':
    case 'geometry:eyeball':
      return drawMeasurePart('report', 'db', b);
    case 'elements:matched':
      return <PairIcon b={b} mixed={false} />;
    case 'elements:mixed':
      return <PairIcon b={b} mixed />;
    case 'clock:one':
      return drawMeasurePart('input', 'recorder', b);
    case 'clock:two':
      return <TwoRecorders b={b} />;
    default:
      return drawMeasurePart(slot, part, b);
  }
};
