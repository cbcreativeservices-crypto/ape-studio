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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../../config/devMode';
import { DEV_COMMERCIAL_FLAG_KEY, DEV_ENTITLEMENT_KEY, FLAG_DEFAULTS } from '../../config/flags';
import { supabase } from '../../lib/supabase';

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
  // Once the owner force-picks a tier via the dev toggle, stop auto-deriving
  // from the session for the rest of this app run (so the toggle isn't clobbered
  // by a token refresh while they inspect a tier).
  const devOverrode = useRef(false);

  // Hydrate the dev commercialMode flag once (dev only — release ignores it).
  useEffect(() => {
    if (!__DEV__) return;
    let alive = true;
    (async () => {
      const flag = await AsyncStorage.getItem(DEV_COMMERCIAL_FLAG_KEY);
      if (alive && flag != null) setCommercialModeState(flag === '1');
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Session-driven BASE entitlement (owner 2026-08-06): a signed-in account is at
  // least 'free' (save + album + achievements), while a no-account guest is
  // 'anonymous'. This is the first real wiring to auth state; academy/lapsed are
  // still previewed via the dev tier toggle (and become server-driven once the
  // entitlements table is read). Only genuine sign-in/out flips it — never a
  // silent token refresh — and the dev override always wins.
  useEffect(() => {
    let alive = true;
    const applyFromSession = (hasSession: boolean) => {
      if (!alive || devOverrode.current) return;
      setEntitlementState(hasSession ? 'free' : 'anonymous');
    };
    void supabase.auth.getSession().then(({ data }) => applyFromSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        applyFromSession(!!session);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setCommercialMode = useCallback((on: boolean) => {
    if (!__DEV__) return;
    setCommercialModeState(on);
    void AsyncStorage.setItem(DEV_COMMERCIAL_FLAG_KEY, on ? '1' : '0');
  }, []);

  const setEntitlement = useCallback((state: Entitlement) => {
    if (!__DEV__) return;
    devOverrode.current = true; // dev is now driving; don't let the session re-derive
    setEntitlementState(state);
    void AsyncStorage.setItem(DEV_ENTITLEMENT_KEY, state);
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      commercialMode,
      entitlement,
      // Caps ladder (owner 2026-08-06): the INSTITUTIONAL app (commercialMode
      // OFF) always renders full academy caps — its access was never gated by
      // this ladder. The COMMERCIAL app (flag ON) renders the reported tier's
      // caps, so anonymous/free/academy/lapsed each show their real
      // gates/veils/upsells. The dev bypass, if on, still forces academy for
      // lock-free screen testing.
      caps:
        !commercialMode || devBypass('bypassAcademyLocks')
          ? capsFor('academy')
          : capsFor(entitlement),
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
