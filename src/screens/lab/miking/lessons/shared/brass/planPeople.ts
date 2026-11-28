/**
 * THE PEOPLE ON A HORN SETTING PLAN (cast figures, owner 2026-11-26): one
 * plan never shows the same person twice. The people a plan must keep — the
 * kit's drummer (kit.drummer), the lesson's own player, the band's singer —
 * stay who their roles say; a neighbor whose role's person is already on the
 * plan is played by the first cast member not yet on it, in the cast's fixed
 * order (never random, never by render order). The brass plans (A01, A02) and
 * the saxophone plans (A05a–d) read it. Pure: cast ids only.
 */
import type { CastId } from '../figureV2/cast';

/** The cast's fixed order (cast.ts). */
export const PLAN_CAST_ORDER: readonly CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];

/** Each neighbor's person, by the neighbor's plan id: its own role's person when free, else the first free one. */
export function planPeople(fixed: readonly CastId[], neighbors: readonly { id: string; want: CastId }[]): Record<string, CastId> {
  const taken = new Set<CastId>(fixed);
  const out: Record<string, CastId> = {};
  for (const n of neighbors) {
    const who = taken.has(n.want) ? (PLAN_CAST_ORDER.find((id) => !taken.has(id)) ?? n.want) : n.want;
    taken.add(who);
    out[n.id] = who;
  }
  return out;
}
