/**
 * Glossary server gateway — the client half of "definitions come through a
 * counting gateway on the server" (owner 2026-09-13).
 *
 * ⚠️ THE ORDERING RULE THIS FILE EXISTS TO OBEY. The server work ships in this
 * order: create the view + RPC → ship the client → **only then** revoke anon
 * SELECT on `glossary`. Reversed, the glossary dies in every build already on a
 * phone, including the ones that will never update. So this client works against
 * BOTH schemas and decides which one it is looking at, ONCE per app session,
 * with `probeGateway()`.
 *
 * That probe is what makes this client shippable AHEAD of the server: until the
 * browse view exists, `probeGateway()` answers 'absent', nothing changes for
 * anyone, and no guest is asked for a device ID that the database has no use
 * for. The day the SQL runs, the same build starts asking.
 *
 * Plan: docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md.
 */
import { supabase } from '../../lib/supabase';
import { classifyGatewayError, type GatewayFault } from './gatewayFault';

export * from './gatewayFault';

// ── Is the gateway deployed? ──────────────────────────────────────────────

export type GatewayProbe = 'deployed' | 'absent';

let PROBE: Promise<GatewayProbe> | null = null;

/** Drop the cached answer (tests, and after the schema could have changed). */
export function resetGatewayProbe(): void {
  PROBE = null;
}

/**
 * One cheap round trip: does `glossary_browse_v` exist?
 *
 * A guest reading it gets `42501` — the view is granted to `authenticated`
 * only — and that denial is the SIGNAL, not a failure: it means the gateway is
 * there and this caller needs a device key. Only "no such relation" means
 * absent.
 *
 * ⚠️ A network failure must NOT be cached, and must not read as 'deployed'.
 * Answering 'deployed' offline would put a consent dialog in front of a user
 * whose device cannot reach the server to act on it.
 */
export function probeGateway(): Promise<GatewayProbe> {
  if (PROBE) return PROBE;
  const p = (async (): Promise<GatewayProbe> => {
    const { error } = await supabase.from('glossary_browse_v').select('id').limit(1);
    const fault = classifyGatewayError(error);
    if (fault === null || fault === 'denied') return 'deployed';
    if (fault === 'not-deployed') return 'absent';
    PROBE = null; // transient — re-probe on the next focus rather than commit
    return 'absent';
  })().catch(() => {
    PROBE = null;
    return 'absent' as const;
  });
  PROBE = p;
  return p;
}

/** Which relation the corpus is paged out of, given the probe's answer. */
export function corpusTable(probe: GatewayProbe): 'glossary_browse_v' | 'glossary' {
  return probe === 'deployed' ? 'glossary_browse_v' : 'glossary';
}

// ── The metered definition read ───────────────────────────────────────────

/**
 * What one metered call returns. The shape deliberately covers EVERY field
 * today's two detail reads pull out of `glossary` and `glossary_full_v`:
 * once anon SELECT on `glossary` is revoked, this RPC is the only way any of
 * them can be read, so a narrower RPC would silently empty the detail body for
 * members as well as guests.
 *
 * `used` / `lim` ride along so the halfway heads-up and the lock countdown cost
 * no extra round trip. They are optional: a deployment whose RPC predates them
 * simply shows no warning.
 */
export type GatewayDefinition = {
  definition: string | null;
  plain_english: string | null;
  purpose_function: string | null;
  practical_application: string | null;
  scenario_contexts: string[] | null;
  related_terms: string[] | null;
  category: string | null;
  difficulty: string | null;
  common_mistakes: string[] | null;
  used?: number | null;
  lim?: number | null;
  window_start?: string | null;
};

export type DefinitionResult = { state: 'ok'; row: GatewayDefinition } | { state: 'fault'; fault: GatewayFault };

/** One metered definition. The SERVER counts it — the client must not also
 *  charge `glossary_consume()` for the same open, or a free week is seven. */
export async function fetchDefinitionViaGateway(id: string): Promise<DefinitionResult> {
  try {
    const { data, error } = await supabase.rpc('get_glossary_definition', { p_id: id });
    const fault = classifyGatewayError(error);
    if (fault) return { state: 'fault', fault };
    const row = (data as GatewayDefinition[] | null)?.[0];
    if (!row) return { state: 'fault', fault: 'error' };
    return { state: 'ok', row };
  } catch (e) {
    const fault = classifyGatewayError({ message: e instanceof Error ? e.message : String(e) });
    return { state: 'fault', fault: fault ?? 'error' };
  }
}
