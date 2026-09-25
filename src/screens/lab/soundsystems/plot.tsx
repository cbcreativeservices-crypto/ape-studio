/**
 * plot — helpers that turn a configuration layout (configs.ts) into what the
 * VenueView draws: placed gear glyphs and coverage beams. Shared by the
 * LEARN chapters that show a layout and by BUILD mode's preview.
 */
import type { PlacedSpeaker } from '../../../features/soundsystems/configs';
import { slotDef } from '../../../features/soundsystems/system';
import type { Placed } from '../../../features/soundsystems/types';
import { colors } from '../../../theme/tokens';
import type { PlotBeam } from './art/VenueView';

/** The honesty micro-badge every coverage plot carries. */
export const PLOT_BADGE = 'CONCEPTUAL COVERAGE — ILLUSTRATIVE MODEL';

const BEAM_COLOR = {
  top: colors.amber,
  sub: '#2f74ff',
  fill: colors.greenBright,
  delay: colors.cyanBright,
} as const;

export function layoutToPlaced(layout: readonly PlacedSpeaker[]): Placed[] {
  return layout.map((p, i) => ({
    id: `${p.kind}-${i}`,
    kind: p.kind === 'sub' ? 'poweredSub' : 'poweredSpeaker',
    slot: p.slot,
  }));
}

export function layoutToBeams(layout: readonly PlacedSpeaker[]): PlotBeam[] {
  return layout.map((p) => {
    const s = slotDef(p.slot);
    if (p.kind === 'sub') return { x: s.x, y: s.y, aimDeg: 0, coverDeg: 360, gain: 0.7, color: BEAM_COLOR.sub };
    const gain = p.kind === 'fill' ? 0.35 : p.kind === 'delay' ? 0.6 : 1;
    return { x: s.x, y: s.y, aimDeg: p.aimDeg ?? 0, coverDeg: p.coverDeg ?? 90, gain, color: BEAM_COLOR[p.kind] };
  });
}

/** Beams for a BUILD-mode system: every radiating loudspeaker on the plot. */
export function placedToBeams(placed: readonly Placed[], live: ReadonlySet<string>): PlotBeam[] {
  const out: PlotBeam[] = [];
  for (const p of placed) {
    const s = slotDef(p.slot);
    const on = live.has(p.id);
    const gain = on ? 1 : 0.08;
    switch (p.kind) {
      case 'poweredSub':
      case 'passiveSub':
        out.push({ x: s.x, y: s.y, aimDeg: 0, coverDeg: 360, gain: gain * 0.7, color: BEAM_COLOR.sub });
        break;
      case 'poweredSpeaker':
      case 'passiveSpeaker': {
        const role = s.role;
        const aim = role === 'main' ? (s.x < 180 ? 18 : s.x > 180 ? -18 : 0) : 0;
        const kind = role === 'fill' ? 'fill' : role === 'delay' ? 'delay' : 'top';
        out.push({ x: s.x, y: s.y, aimDeg: aim, coverDeg: 90, gain: gain * (kind === 'fill' ? 0.35 : kind === 'delay' ? 0.6 : 1), color: BEAM_COLOR[kind] });
        break;
      }
      case 'wedge':
      case 'poweredWedge':
        // fires back at the performer (up the plot)
        out.push({ x: s.x, y: s.y, aimDeg: 180, coverDeg: 70, gain: gain * 0.3, color: '#c9a6ff' });
        break;
      default:
        break;
    }
  }
  return out;
}
