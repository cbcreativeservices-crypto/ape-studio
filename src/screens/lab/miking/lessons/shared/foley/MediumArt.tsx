/**
 * THE SENSING-MEDIUM CARD, drawn (medium.ts holds the words): three panels
 * side by side, the same basin in each — AIR (a small condenser above the
 * water, outside the splash), WATER (a hydrophone in the water, its cable
 * out over the rim) and STRUCTURE (a contact sensor on the dry outside wall).
 * Static, silent; one accessible canvas with its words in the label.
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { SdcMic } from '../../../../../../features/lab/micDrawings';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { SoundCanvas } from '../smallperc/soundKit';
import { make, rrect } from '../concert/paths.ts';
import { Basin } from './props';
import { BASIN } from './propGeom.ts';
import { MEDIA } from './medium.ts';

export const MEDIUM_BOX = { u0: -330, u1: 1730, v0: -560, v1: 230 };
const STEP = 700;

function Hydrophone({ x, y }: { x: number; y: number }) {
  const g = useMemo(() => {
    const body = make();
    rrect(body, x - 14, y - 40, x + 14, y + 40, 12);
    const cable = make();
    cable.moveTo(x, y - 40);
    cable.cubicTo(x, y - 140, x + 120, y - 160, x + BASIN.R + 40, y - 100);
    cable.lineTo(x + BASIN.R + 60, y + 40);
    return { body, cable };
  }, [x, y]);
  return (
    <Group>
      <Path path={g.cable} style="stroke" strokeWidth={6} strokeCap="round" color="#0b0c0f" />
      <Path path={g.body}>
        <LinearGradient start={vec(x - 14, 0)} end={vec(x + 14, 0)} colors={['#5b5f69', '#1d1e23']} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={2} color="#050506" />
    </Group>
  );
}

function ContactPuck({ x, y }: { x: number; y: number }) {
  const g = useMemo(() => {
    const puck = make();
    rrect(puck, x, y - 22, x + 18, y + 22, 6);
    const cable = make();
    cable.moveTo(x + 18, y);
    cable.cubicTo(x + 80, y, x + 90, y + 60, x + 140, y + 120);
    return { puck, cable };
  }, [x, y]);
  return (
    <Group>
      <Path path={g.cable} style="stroke" strokeWidth={6} strokeCap="round" color="#0b0c0f" />
      <Path path={g.puck}>
        <LinearGradient start={vec(x, y - 22)} end={vec(x + 18, y + 22)} colors={['#c7ccd4', '#6b707b']} />
      </Path>
      <Path path={g.puck} style="stroke" strokeWidth={2} color="#08080a" />
    </Group>
  );
}

export function MediumCardArt({ w, h }: { w: number; h: number }) {
  const labels: StaticLabel[] = MEDIA.map((m, i) => ({ id: m.id, text: m.title, u: i * STEP, v: -520, align: 'center' as const, tone: (i === 0 ? 'amber' : 'blue') as 'amber' | 'blue' }));
  labels.push({ id: 'n', text: 'THREE PATHS · EACH ITS OWN LABELLED TRACK', short: 'THREE PATHS', u: 700, v: 205, align: 'center', tone: 'illustrative' });
  const label = `Three ways to pick up a basin of water. ${MEDIA.map((m) => `${m.title}: ${m.sensor}. ${m.hears}`).join(' ')}`;
  return (
    <SoundCanvas w={w} h={h} box={MEDIUM_BOX} label={label} labels={labels}>
      {MEDIA.map((m, i) => (
        <Group key={m.id} transform={[{ translateX: i * STEP }]}>
          <Basin view="side" splash={false} />
          {m.id === 'air' ? (
            <Group transform={[{ translateX: 120 }, { translateY: -360 }, { rotate: -0.32 }]}>
              <SdcMic r={10.5} len={104} />
            </Group>
          ) : null}
          {m.id === 'water' ? <Hydrophone x={-20} y={30} /> : null}
          {m.id === 'structure' ? <ContactPuck x={BASIN.R * 0.93} y={0} /> : null}
        </Group>
      ))}
    </SoundCanvas>
  );
}
