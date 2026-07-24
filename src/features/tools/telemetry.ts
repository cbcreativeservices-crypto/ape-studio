/**
 * useToolUsage — T-1 tool-usage telemetry (Q3 ruling; backend deployed
 * 2026-07-24, docs/APE_GOVERNANCE_DECISIONS_2026_07_23.md R4). Records ONE
 * {tool_id, opened_at, duration_seconds} event per tool session via the
 * record_tool_usage RPC.
 *
 * SCOPE (Q3, non-negotiable): opens + durations ONLY — never any measurement
 * content, audio, or reading. Fire-and-forget on unmount; ALL errors swallowed
 * so telemetry can never block, delay, or break the tool UX. Authenticated
 * users only (the RPC needs a users row; anonymous/local users are skipped).
 *
 * Attach at each tool's session-owning screen: ToolInfoScreen (spl/rta/
 * waveform/spectrogram/rt60/signalgen — it stays mounted while the live screen
 * is pushed on top, so its mount→unmount span ≈ the whole tool session) and
 * FrequencyCounterScreen (hzcounter, which skips ToolInfo).
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useEntitlement } from '../commercial/EntitlementProvider';

/** Skip sub-second bounces and absurd durations (the RPC also caps at 86400). */
const MIN_SECONDS = 1;
const MAX_SECONDS = 86400;

export function useToolUsage(toolId: string): void {
  const { entitlement } = useEntitlement();
  // Captured in refs so the unmount cleanup reads the latest values without
  // re-subscribing the effect (which would restart the session clock).
  const authedRef = useRef(false);
  authedRef.current = entitlement !== 'anonymous';
  const toolRef = useRef(toolId);
  toolRef.current = toolId;
  const openedAtRef = useRef(0);

  useEffect(() => {
    openedAtRef.current = Date.now();
    return () => {
      if (!authedRef.current) return;
      const openedMs = openedAtRef.current;
      const duration = Math.round((Date.now() - openedMs) / 1000);
      if (duration < MIN_SECONDS || duration > MAX_SECONDS) return;
      // Fire-and-forget; swallow every outcome — telemetry never affects the UX.
      void supabase
        .rpc('record_tool_usage', {
          p_tool_id: toolRef.current,
          p_opened_at: new Date(openedMs).toISOString(),
          p_duration_seconds: duration,
        })
        .then(
          () => {},
          () => {},
        );
    };
    // Session clock starts once on mount; refs carry the latest tool/auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
