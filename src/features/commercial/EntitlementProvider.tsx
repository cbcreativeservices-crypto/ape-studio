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
import { clearAllLocalMethodStates } from '../study/localProgress';
import { emitStudyProgress } from '../study/sync';

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

/**
 * Map the caller's academy entitlement rows → tier. A user may hold MULTIPLE
 * academy rows (e.g. an expired one + an active one) with NO guaranteed order,
 * so we scan for ANY active, non-expired row rather than trusting row [0] (owner
 * debug audit — the old `[0]` could classify an active member as lapsed).
 */
type EntRow = { status?: string; expires_at?: string | null };
function academyTierFromRows(rows: EntRow[]): Entitlement {
  const now = Date.now();
  const active = rows.some(
    (r) => r.status === 'active' && (!r.expires_at || new Date(r.expires_at).getTime() > now),
  );
  return active ? 'academy' : rows.length > 0 ? 'lapsed' : 'free';
}

type EntitlementContextValue = {
  /** Master flag — OFF means render today's (institutional) app. */
  commercialMode: boolean;
  /** Current (mock) entitlement state. */
  entitlement: Entitlement;
  /** Capabilities for the current state. */
  caps: Caps;
  /**
   * TRUE academy standing — the single source for member-perk / training gates
   * (Audio Tools LEARN/DEMO, EarLab, colour customization, Tube Reference, etc.).
   *
   * There are TWO deliberate gating idioms (do not merge them):
   *   • `caps.*`   — the ladder capabilities, which the dev `bypassAcademyLocks`
   *                  forces to academy so screens can be tested LOCK-FREE.
   *   • `isMember` — real academy standing, NOT affected by that bypass, so the
   *                  owner can test the genuine FREE experience of the member
   *                  perks while caps-bypass is on (see ToolLockUi header).
   * Use `caps` for ladder content; use `isMember` for member-only extras.
   */
  isMember: boolean;
  /** DEV-ONLY overrides (persisted). No-ops outside __DEV__. */
  setCommercialMode: (on: boolean) => void;
  setEntitlement: (state: Entitlement) => void;
  /** Re-read the server entitlement NOW (e.g. after redeeming an access code).
   *  Real read on every build — unlike setEntitlement, which is dev-only. */
  refreshEntitlement: () => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  // Boot default (owner 2026-08-06): commercialMode is ON — institutional mode is
  // retired and the app IS the commercial app (FLAG_DEFAULTS.commercialMode=true).
  // Boot still routes to the finished login screen (Splash → Auth/Main); the WIP
  // pre-auth Landing is not wired into startup. Long-press the logo to toggle the
  // dead institutional path for inspection.
  const [commercialMode, setCommercialModeState] = useState<boolean>(FLAG_DEFAULTS.commercialMode);
  const [entitlement, setEntitlementState] = useState<Entitlement>('anonymous');
  // Once the owner force-picks a tier via the dev toggle, stop auto-deriving
  // from the session for the rest of this app run (so the toggle isn't clobbered
  // by a token refresh while they inspect a tier).
  const devOverrode = useRef(false);
  // Track the signed-in user id so we can wipe the device-local study mirror
  // when the account changes (owner 2026-08-11).
  const lastUid = useRef<string | null>(null);
  const uidSeeded = useRef(false);

  // Server-driven entitlement (owner 2026-08-06): a no-account guest is
  // 'anonymous'; a signed-in account reads its real tier from the `entitlements`
  // table (RLS `ent_self_read` scopes it to the caller) — an ACTIVE academy
  // product ⇒ 'academy', an academy product that's inactive/expired ⇒ 'lapsed',
  // otherwise ⇒ 'free' (save + album + achievements). Only genuine sign-in/out
  // triggers a re-read — never a silent token refresh — and the dev tier toggle
  // always wins once used.
  useEffect(() => {
    let alive = true;
    const deriveAndApply = async (hasSession: boolean) => {
      if (!alive || devOverrode.current) return;
      if (!hasSession) {
        setEntitlementState('anonymous');
        return;
      }
      const { data, error } = await supabase
        .from('entitlements')
        .select('product, status, expires_at')
        .eq('product', 'academy');
      if (error) {
        // supabase-js RESOLVES with { error }; a transient RLS/network failure
        // must NOT silently downgrade a paying member to free. Keep the current
        // tier and let a later auth event / refreshEntitlement re-derive.
        console.warn('[entitlement] read failed, keeping current tier:', error.message);
        return;
      }
      const tier = academyTierFromRows((data ?? []) as EntRow[]);
      if (alive && !devOverrode.current) setEntitlementState(tier);
    };
    // Wipe the device's local study-progress mirror whenever the signed-in user
    // CHANGES (sign-out, or sign-in as a different account) so progress never
    // leaks across sessions — a fresh free/no-account login starts clear
    // (owner 2026-08-11). The first observed session just seeds the baseline —
    // EXCEPT a guest launch (no session at app start): a no-account user is
    // factory-reset every session, our stated no-tracking promise (owner
    // 2026-08-17), so the mirror from any previous guest run is wiped too.
    const clearLocalOnUserChange = (uid: string | null) => {
      if ((uidSeeded.current && uid !== lastUid.current) || (!uidSeeded.current && uid === null)) {
        void clearAllLocalMethodStates();
        emitStudyProgress(); // refresh any live dashboard off the cleared mirror
      }
      lastUid.current = uid;
      uidSeeded.current = true;
    };
    void supabase.auth.getSession().then(({ data }) => {
      clearLocalOnUserChange(data.session?.user?.id ?? null);
      deriveAndApply(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        // A REAL sign-in OR sign-out ends any dev tier override (owner
        // 2026-08-12; extended to SIGNED_IN per launch-triage). The wordmark
        // long-press AND entering Guest Mode both latch devOverrode for the app
        // run; without clearing on SIGNED_IN, tapping Guest and then logging in
        // as an academy account stayed gated as anonymous/free forever (the
        // login never re-read the server). The wordmark tier toggle fires no
        // auth event, so it still persists between real sign-in/out. DEV-only —
        // setEntitlement no-ops in release, so devOverrode is never set there.
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') devOverrode.current = false;
        clearLocalOnUserChange(session?.user?.id ?? null);
        void deriveAndApply(!!session);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Re-read the server entitlement on demand (after redeeming an access code, a
  // purchase, etc.). Mirrors the effect's derive logic but is callable anytime.
  // Respects a dev tier override so it doesn't clobber the wordmark toggle.
  const refreshEntitlement = useCallback(async () => {
    if (devOverrode.current) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setEntitlementState('anonymous');
      return;
    }
    const { data, error } = await supabase
      .from('entitlements')
      .select('product, status, expires_at')
      .eq('product', 'academy');
    if (error) {
      // Don't downgrade on a transient read failure (see deriveAndApply).
      console.warn('[entitlement] refresh read failed, keeping current tier:', error.message);
      return;
    }
    const tier = academyTierFromRows((data ?? []) as EntRow[]);
    if (!devOverrode.current) setEntitlementState(tier);
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
      // Real standing (see the doc on isMember above) — deliberately NOT
      // bypass-aware, so member-perk gates stay testable-as-free.
      isMember: entitlement === 'academy',
      setCommercialMode,
      setEntitlement,
      refreshEntitlement,
    }),
    [commercialMode, entitlement, setCommercialMode, setEntitlement, refreshEntitlement],
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
