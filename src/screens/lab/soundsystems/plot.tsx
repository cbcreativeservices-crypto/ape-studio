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
 *  edge meets the centre line about a third of the way back (mainL at
 *  44,122 aimed +18° with 90°: the 63° edge crosses x = 180 at y ≈ 191, the
 *  audience spanning y 140–314). */
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

/** Where a BUILD feed tag ("AUX 2", "MAIN L", "OUT ?") prints beside its
 *  loudspeaker. Below the box by default (VenueView's +26), except where a
 *  neighbour sits there at the plot's drawn size (WF-SS-02 clutter pass,
 *  2026-10-20):
 *    · a sub at house left/right prints ABOVE itself — below, its tag ran
 *      into the main's tag 36 units outboard;
 *    · the centre cluster prints to its LEFT — below is the centre sub;
 *    · an in-ear pack prints beside itself (feedTagPlace's kind). */
export function feedTagPlace(slot: SlotId, kind?: Placed['kind']): Pick<PlotBeam, 'feedDx' | 'feedDy' | 'feedAnchor'> {
  // An in-ear pack prints beside itself: below a stage position is the
  // wedge row, below the stage-left wing the main right box (SS-R2-13).
  if (kind === 'iemPack') return slot === 'wingL' ? { feedDx: -12, feedDy: -6, feedAnchor: 'end' } : { feedDx: 12, feedDy: 4, feedAnchor: 'start' };
  if (slot === 'subL' || slot === 'subR') return { feedDy: -18 };
  if (slot === 'mainC') return { feedDx: -12, feedDy: 4, feedAnchor: 'end' };
  return {};
}

/** The four wedge positions stand 40 units apart on one row: their tags
 *  print without the space ("AUX1") so neighbours read as separate words
 *  (SS-R2-13). */
const WEDGE_ROW: readonly SlotId[] = ['mon1', 'mon2', 'mon3', 'mon4'];
const compactTag = (tag: string) => tag.replace(/^AUX (\d)$/, 'AUX$1');

/** Beams for a BUILD-mode system: every radiating loudspeaker on the plot,
 *  aimed by its position — mains toed in, side fills across the stage, the
 *  drum fill at the drummer, wedges back at the performer. `feeds` (BUILD)
 *  gives each loudspeaker's tag: the console output its cable carries. */
export function placedToBeams(placed: readonly Placed[], live: ReadonlySet<string>, feeds?: ReadonlyMap<string, string>): PlotBeam[] {
  const out: PlotBeam[] = [];
  for (const p of placed) {
    const s = slotDef(p.slot);
    const on = live.has(p.id);
    const n = out.length;
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
      case 'iemPack':
        // The pack radiates into one pair of ears, not the room: its feed is
        // tagged (SS-R2-13), with no coverage drawn.
        if (feeds?.has(p.id)) out.push({ x: s.x, y: s.y, aimDeg: 0, coverDeg: 0, color: BEAM_COLOR.wedge, live: on, tagOnly: true });
        break;
      default:
        break;
    }
    const tag = feeds?.get(p.id);
    if (tag && out.length > n) out[n] = { ...out[n], feed: WEDGE_ROW.includes(p.slot) ? compactTag(tag) : tag, ...feedTagPlace(p.slot, p.kind) };
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
