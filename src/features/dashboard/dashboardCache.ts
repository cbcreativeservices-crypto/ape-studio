/**
 * dashboardCache — in-memory cache of the last successfully loaded Dashboard
 * (owner 2026-08-17: returning to the Dashboard often delayed landing while the
 * whole screen cold-loaded; instead the screen mounts INSTANTLY on the cached
 * content and the fresh fetch streams in silently behind it).
 *
 * Module-scope only (no persistence): survives navigation/unmounts within a
 * session, gone on cold launch. Cleared on sign-out/account-switch via
 * resetAllLocalStores() like every other in-memory store, so a new account can
 * never flash the previous user's dashboard.
 */
import type { DashboardData } from './api';

let cached: { data: DashboardData; topicIdx: number } | null = null;

export function getDashboardCache(): { data: DashboardData; topicIdx: number } | null {
  return cached;
}

export function setDashboardCache(data: DashboardData, topicIdx: number): void {
  cached = { data, topicIdx };
}

/** Account wipe (clearLocalAccountData pattern). */
export function resetLocal(): void {
  cached = null;
}
