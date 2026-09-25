/**
 * plot — helpers that turn a configuration layout (configs.ts) or a BUILD
 * system into what the VenueView draws: placed gear, coverage beams with
 * real throws and patterns, feed tags and aims. Shared by the LEARN chapters
 * that show a layout and by BUILD mode.
 */
import type { PlacedSpeaker } from '../../../features/soundsystems/configs';
import { slotDef } from '../../../features/soundsystems/system';
import type { Placed, SlotId } from '../../../features/soundsystems/types';
import { colors } from '../../../theme/tokens';
import type { PlotBeam } from './art/VenueView';

/** The honesty micro-badge every coverage plot carries. */
export const PLOT_BADGE = 'CONCEPTUAL COVERAGE — ILLUSTRATIVE MODEL';

export const BEAM_COLOR = {
  top: colors.amber,
  sub: '#2f74ff',
  fill: colors.greenBright,
  delay: colors.cyanBright,
  wedge: '#c9a6ff',
} as const;

/** On-axis reference distances (0 dB there), plot units. A main is chosen to
 *  cover to the back of the room; a front fill covers the first rows. */
export const THROW = { top: 120, delay: 80, sideFill: 80, fill: 40, wedge: 30, sub: 90 } as const;

/** Toe-in for a main at a house-left/right corner: each main's inner −6 dB
 *  edge meets the centre line about two-thirds back. */
export function mainAim(slot: SlotId): number {
  const s = slotDef(slot);
  return s.x < 180 ? 18 : s.x > 180 ? -18 : 0;
}

function aimToward(from: SlotId, to: SlotId): number {
  const a = slotDef(from);
  const b = slotDef(to);
  return (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
}

export function layoutToPlaced(layout: readonly PlacedSpeaker[], powered = true): Placed[] {
  return layout.map((p, i) => ({
    id: `${p.kind}-${i}`,
    kind: p.kind === 'sub' ? (powered ? 'poweredSub' : 'passiveSub') : powered ? 'poweredSpeaker' : 'passiveSpeaker',
    slot: p.slot,
  }));
}

export function layoutToBeams(layout: readonly PlacedSpeaker[], opts: { flown?: boolean; live?: boolean } = {}): PlotBeam[] {
  return layout.map((p) => {
    const s = slotDef(p.slot);
    if (p.kind === 'sub') {
      return { x: s.x, y: s.y, aimDeg: 0, coverDeg: 360, pattern: 'omni', gain: 0.5, throw: THROW.sub, color: BEAM_COLOR.sub, feed: p.feed, live: opts.live ?? true };
    }
    const kind = p.kind;
    const gain = kind === 'fill' ? 0.06 : kind === 'delay' ? 0.16 : 1;
    const thr = kind === 'fill' ? THROW.fill : kind === 'delay' ? THROW.delay : THROW.top;
    return {
      x: s.x,
      y: s.y,
      aimDeg: p.aimDeg ?? (kind === 'top' ? mainAim(p.slot) : 0),
      coverDeg: p.coverDeg ?? 90,
      gain,
      throw: thr,
      reach: kind === 'fill' ? 1.4 : 1.8,
      rig: kind === 'top' && opts.flown ? 'flown' : 'stack',
      color: BEAM_COLOR[kind],
      feed: p.feed,
      delayMs: p.delayMs,
      live: opts.live ?? true,
    };
  });
}

/** Beams for a BUILD-mode system: every radiating loudspeaker on the plot,
 *  aimed by its position — mains toed in, side fills across the stage, the
 *  drum fill at the drummer, wedges back at the performer. */
export function placedToBeams(placed: readonly Placed[], live: ReadonlySet<string>): PlotBeam[] {
  const out: PlotBeam[] = [];
  for (const p of placed) {
    const s = slotDef(p.slot);
    const on = live.has(p.id);
    switch (p.kind) {
      case 'poweredSub':
      case 'passiveSub':
        if (s.role === 'monitor') {
          out.push({ x: s.x, y: s.y, aimDeg: aimToward(p.slot, 'riserL'), coverDeg: 360, pattern: 'omni', gain: 0.2, throw: THROW.wedge, color: BEAM_COLOR.wedge, live: on });
        } else {
          out.push({ x: s.x, y: s.y, aimDeg: 0, coverDeg: 360, pattern: 'omni', gain: 0.5, throw: THROW.sub, color: BEAM_COLOR.sub, live: on });
        }
        break;
      case 'poweredSpeaker':
      case 'passiveSpeaker': {
        const role = s.role;
        const kind = role === 'fill' ? 'fill' : role === 'delay' ? 'delay' : 'top';
        const gain = kind === 'fill' ? 0.06 : kind === 'delay' ? 0.16 : 1;
        const thr = kind === 'fill' ? THROW.fill : kind === 'delay' ? THROW.delay : THROW.top;
        out.push({ x: s.x, y: s.y, aimDeg: kind === 'top' ? mainAim(p.slot) : 0, coverDeg: 90, gain, throw: thr, reach: kind === 'fill' ? 1.4 : 1.8, color: BEAM_COLOR[kind], live: on });
        break;
      }
      case 'wedge':
      case 'poweredWedge': {
        const aim = p.slot === 'sideFillL' ? -90 : p.slot === 'sideFillR' ? 90 : p.slot === 'drumFill' ? aimToward(p.slot, 'riserL') : 180;
        const thr = p.slot === 'sideFillL' || p.slot === 'sideFillR' ? THROW.sideFill : THROW.wedge;
        // a monitor's sector stops at the performer it serves — it never
        // paints the house
        out.push({ x: s.x, y: s.y, aimDeg: aim, coverDeg: 70, gain: 0.1, throw: thr, reach: 1.1, color: BEAM_COLOR.wedge, live: on });
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/** The plan-glyph rotation for a placed device: loudspeakers face their
 *  aim; everything else faces the audience. */
export function placedRotation(p: Placed): number {
  const s = slotDef(p.slot);
  switch (p.kind) {
    case 'poweredSpeaker':
    case 'passiveSpeaker':
      return s.role === 'main' ? mainAim(p.slot) : 0;
    case 'wedge':
    case 'poweredWedge':
      return p.slot === 'sideFillL' ? -90 : p.slot === 'sideFillR' ? 90 : p.slot === 'drumFill' ? aimToward(p.slot, 'riserL') : 180;
    case 'console':
      return 180;
    default:
      return 0;
  }
}
