/**
 * EntitlementProvider — commercial entitlement state (CM1, Booth 2026-07-11).
 *
 * MOCK for now: state is local + dev-toggleable + persisted (dev only). It will
 * be wired to SERVER TRUTH later — the client never DECIDES entitlement, it
 * renders whatever the provider reports (server-owned once live). Do not put
 * grading/gating/entitlement decisions in consumers; branch on the reported
 * capabilities only.
 *
 * Also owns the `commercialMode` master flag (compile-time default OFF; dev
 * runtime override persisted). Flag OFF ⇒ consumers render today's app.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../../config/devMode';
import { DEV_COMMERCIAL_FLAG_KEY, DEV_ENTITLEMENT_KEY, FLAG_DEFAULTS } from '../../config/flags';

export type Entitlement = 'anonymous' | 'free' | 'academy' | 'lapsed';

export const ENTITLEMENTS: Entitlement[] = ['anonymous', 'free', 'academy', 'lapsed'];

/** What each state may render. Consumers branch on these, never on the raw
 *  state name, so the ladder lives in ONE place (§3). */
export type Caps = {
  /** Common Mistakes BODIES visible (heading always shows; body may be locked). */
  commonMistakes: boolean;
  /** Audio Tools hub unlocked (vs visible-but-locked). */
  audioTools: boolean;
  /** All topics playable (vs free topics only). */
  allTopics: boolean;
  /** Free topics (gs0/gs36) playable end-to-end. */
  freeTopics: boolean;
  /** Progress syncs to the server (vs device-local only). */
  syncedProgress: boolean;
  /** Album + Achievements live. */
  albumAchievements: boolean;
  /** Completion records available. */
  completionRecords: boolean;
};

/** The ratified ladder (§3) as a pure map. Server truth will drive the STATE;
 *  this map converts state → capabilities for rendering. */
export function capsFor(state: Entitlement): Caps {
  switch (state) {
    case 'academy':
      return {
        commonMistakes: true,
        audioTools: true,
        allTopics: true,
        freeTopics: true,
        syncedProgress: true,
        albumAchievements: true,
        completionRecords: true,
      };
    case 'free':
      return {
        commonMistakes: false,
        audioTools: false,
        allTopics: false,
        freeTopics: true,
        syncedProgress: true,
        albumAchievements: true,
        completionRecords: false,
      };
    case 'lapsed':
      // Trophies/Album/records stay visible; academy content + tools + Common
      // Mistakes re-lock; free topics still work.
      return {
        commonMistakes: false,
        audioTools: false,
        allTopics: false,
        freeTopics: true,
        syncedProgress: true,
        albumAchievements: true,
        completionRecords: true,
      };
    case 'anonymous':
    default:
      return {
        commonMistakes: false,
        audioTools: false,
        allTopics: false,
        freeTopics: false,
        syncedProgress: false,
        albumAchievements: false,
        completionRecords: false,
      };
  }
}

type EntitlementContextValue = {
  /** Master flag — OFF means render today's (institutional) app. */
  commercialMode: boolean;
  /** Current (mock) entitlement state. */
  entitlement: Entitlement;
  /** Capabilities for the current state. */
  caps: Caps;
  /** DEV-ONLY overrides (persisted). No-ops outside __DEV__. */
  setCommercialMode: (on: boolean) => void;
  setEntitlement: (state: Entitlement) => void;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [commercialMode, setCommercialModeState] = useState<boolean>(FLAG_DEFAULTS.commercialMode);
  const [entitlement, setEntitlementState] = useState<Entitlement>('anonymous');

  // Hydrate dev overrides once (dev only — release builds ignore them).
  useEffect(() => {
    if (!__DEV__) return;
    let alive = true;
    (async () => {
      const [flag, ent] = await Promise.all([
        AsyncStorage.getItem(DEV_COMMERCIAL_FLAG_KEY),
        AsyncStorage.getItem(DEV_ENTITLEMENT_KEY),
      ]);
      if (!alive) return;
      if (flag != null) setCommercialModeState(flag === '1');
      if (ent != null && (ENTITLEMENTS as string[]).includes(ent)) setEntitlementState(ent as Entitlement);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setCommercialMode = useCallback((on: boolean) => {
    if (!__DEV__) return;
    setCommercialModeState(on);
    void AsyncStorage.setItem(DEV_COMMERCIAL_FLAG_KEY, on ? '1' : '0');
  }, []);

  const setEntitlement = useCallback((state: Entitlement) => {
    if (!__DEV__) return;
    setEntitlementState(state);
    void AsyncStorage.setItem(DEV_ENTITLEMENT_KEY, state);
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      commercialMode,
      entitlement,
      // DEV BYPASS (Booth 2026-07-18): force full academy caps so no
      // academy-only lock/veil/upsell blocks screen testing. __DEV__-guarded
      // inside devBypass(); restore = devMode.ts → bypassAcademyLocks:false.
      caps: devBypass('bypassAcademyLocks') ? capsFor('academy') : capsFor(entitlement),
      setCommercialMode,
      setEntitlement,
    }),
    [commercialMode, entitlement, setCommercialMode, setEntitlement],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used within <EntitlementProvider>');
  return ctx;
}

/** Convenience: the master flag alone (most consumers gate on this first). */
export function useCommercialMode(): boolean {
  return useEntitlement().commercialMode;
}
