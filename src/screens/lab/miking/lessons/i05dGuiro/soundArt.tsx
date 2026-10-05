/**
 * I05d GÜIRO — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2): the güiro
 * lengthwise, seen from the audience, drawn large; its ridges along the top.
 *
 *   ScrapeSequence  ① the scraper starts at one end of the ridges; ② each
 *                   ridge it crosses flicks it — a tiny click; ③ the hollow
 *                   body resonates under the clicks; ④ sound leaves the whole
 *                   body — a rasp.
 *   ScrapeLength    the pair (copy.sound.pair): a LONG scrape crosses many
 *                   ridges, a SHORT one few (PAS: short and long scrapes give
 *                   short and long sounds). SWING moves the scraper.
 *
 * Simplifications register (guiro/SOURCES.md): ridges drawn wider apart than
 * real; marks show ORDER and WHERE, never level.
 */
import { useMemo } from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { VariantId } from '../../engine/model/types.ts';
import type { StaticLabel } from '../../engine/scene/StaticLabels';
import { make, rrect } from '../shared/concert/paths.ts';
import { Guiro, Stick, WOOD_HANDLE } from '../shared/smallperc/objects';
import { AMBER, Arrow, BLUE, Burst, eventOpacity, Radiate, SoundCanvas } from '../shared/smallperc/soundKit';
import { GL, GR, GU_DIMS, RIDGE_HALF } from './model.ts';

export const SOUND_BOX = { u0: -240, u1: 240, v0: -195, v1: 130 };
const PLASTIC = ['#f2f4f7', '#c9ced6', '#8d939d', '#565b64'];
const TOP = -GR;

function Body({ glass }: { glass: boolean }) {
  return <Guiro c={[0, 0]} angle={0} len={GL} dMax={GU_DIMS.dMax.mm} dMin={GU_DIMS.dMin.mm} fiberglass={glass} />;
}

/** The scraper, its tip on the ridges at `x`, leaning back toward the hand. */
function Scraper({ x, glass }: { x: number; glass: boolean }) {
  return <Stick a={[x - 55, TOP - 100]} b={[x, TOP - 2]} w={9} colors={glass ? PLASTIC : WOOD_HANDLE} />;
}

/** The ridges a stroke has crossed, from `x0` to `x1`: an amber band. */
function Crossed({ x0, x1 }: { x0: number; x1: number }) {
  const p = useMemo(() => {
    const q = make();
    if (x1 - x0 > 1) rrect(q, x0, TOP - 9, x1, TOP + 5, 4);
    return q;
  }, [x0, x1]);
  return <Path path={p} color={AMBER} opacity={0.55} />;
}

export function GuiroScrape({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const glass = variant === 'fiberglass';
  const x = shown >= 4 ? RIDGE_HALF + 30 : shown >= 2 ? RIDGE_HALF * 0.35 : -RIDGE_HALF;
  const labels: StaticLabel[] = [];
  if (shown >= 1) labels.push({ id: 's1', text: '① THE SCRAPER STARTS AT ONE END', short: '① START', u: -232, v: -185, align: 'left', tone: 'amber' });
  if (shown >= 2) labels.push({ id: 's2', text: '② EACH RIDGE FLICKS IT: A CLICK', short: '② CLICKS', u: -232, v: -163, align: 'left', tone: 'amber' });
  if (shown >= 3) labels.push({ id: 's3', text: '③ THE HOLLOW BODY RESONATES', short: '③ BODY', u: -232, v: 118, align: 'left', tone: 'blue' });
  if (shown >= 4) labels.push({ id: 's4', text: 'A RASP ④', short: '④ OUT', u: 232, v: 118, align: 'right', tone: 'blue' });
  const ticks = [];
  for (let t = -RIDGE_HALF; t <= Math.min(x, RIDGE_HALF); t += 22) ticks.push(t);
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Body glass={glass} />
      <Group opacity={eventOpacity(shown, 2)}>
        <Crossed x0={-RIDGE_HALF} x1={Math.min(x, RIDGE_HALF)} />
        {ticks.map((t) => (
          <Burst key={t} c={[t, TOP - 4]} r0={5} r1={10} n={5} phase={-1.6} />
        ))}
      </Group>
      <Group opacity={shown >= 1 ? 1 : 0}>
        <Scraper x={x} glass={glass} />
        <Arrow a={[x + 14, TOP - 34]} b={[x + 90, TOP - 34]} color={AMBER} width={4} head={10} />
      </Group>
      <Group opacity={eventOpacity(shown, 3)}>
        <Radiate c={[0, 6]} radii={[12, 24]} a0={-180} a1={180} color={BLUE} />
      </Group>
      <Group opacity={shown >= 4 ? 1 : 0}>
        {[-110, 0, 110].map((u) => (
          <Group key={u}>
            <Radiate c={[u, 0]} radii={[GR + 18, GR + 36]} a0={-125} a1={-55} />
            <Radiate c={[u, 0]} radii={[GR + 18, GR + 36]} a0={55} a1={125} />
          </Group>
        ))}
      </Group>
    </SoundCanvas>
  );
}

/** Step 2: `together` = a LONG scrape (many ridges); `opposed` = a SHORT one. */
export function GuiroLength({ w, h, variant, mode, swing, accessibilityLabel }: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) {
  const glass = variant === 'fiberglass';
  const short = mode === 'opposed';
  const x0 = short ? -RIDGE_HALF * 0.2 : -RIDGE_HALF;
  const k = Math.max(0, Math.min(1, (swing + 1) / 2));
  const x = x0 + k * (short ? RIDGE_HALF * 0.4 : RIDGE_HALF * 2);
  const labels: StaticLabel[] = [
    { id: 's', text: short ? 'A SHORT SCRAPE' : 'A LONG SCRAPE', short: short ? 'SHORT' : 'LONG', u: 0, v: -180, align: 'center', tone: 'amber' },
    { id: 'o', text: short ? 'FEW RIDGES: A SHORT RASP' : 'MANY RIDGES: A LONG RASP', short: short ? 'SHORT RASP' : 'LONG RASP', u: 0, v: 118, align: 'center', tone: 'blue' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={SOUND_BOX} label={accessibilityLabel} labels={labels}>
      <Body glass={glass} />
      <Crossed x0={x0} x1={Math.max(x0, x)} />
      <Scraper x={x} glass={glass} />
    </SoundCanvas>
  );
}
