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
import { softDeadline } from '../../lib/boundedCall';
import { getDeviceId } from '../account/deviceIdentity';
import { classifyGatewayError, type GatewayFault } from './gatewayFault';

export * from './gatewayFault';

// ── Is the gateway deployed? ──────────────────────────────────────────────

export type GatewayProbe = 'deployed' | 'absent';

let PROBE: Promise<GatewayProbe> | null = null;

/** A one-row read; long enough for a slow link, short of the screen's 9 s
 *  "stuck" deadline so a stall resolves before the reader is told it failed. */
const PROBE_DEADLINE_MS = 8000;

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
 *
 * Confirmed against the live database the day the view was created: a guest
 * with no key selecting from it gets exactly
 *   42501 · permission denied for view glossary_browse_v
 * which `classifyGatewayError` maps to 'denied' and this reads as 'deployed'.
 */
export function probeGateway(): Promise<GatewayProbe> {
  if (PROBE) return PROBE;
  const p = (async (): Promise<GatewayProbe> => {
    /**
     * ⛔ BOUNDED (full-app run 1, 2026-10-01). This promise is cached for the
     * whole app session, so a STALLED probe (a socket that stops answering —
     * Android's RN fetch has no timeout of its own) never settled and never
     * cleared: every Glossary visit sat on 'unknown' until the stuck card, and
     * every lab / calculator term popup that awaits this span forever. A stall
     * now reads as the transient fault it is — not cached, re-probed next time.
     */
    const { error } = await softDeadline<{ error: { code?: string | null; message?: string } | null }>(
      async () => ({ error: (await supabase.from('glossary_browse_v').select('id').limit(1)).error }),
      { error: { message: 'gateway probe timeout' } },
      'glossary_browse_v probe',
      PROBE_DEADLINE_MS,
    );
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

/**
 * Which relation the corpus is paged out of.
 *
 * ⛔ THE FALLBACK USED TO BE `public.glossary`, AND THAT IS NOW A FAIL-CLOSED.
 *
 * VERIFIED ON THE LIVE PROJECT 2026-09-20: `public.glossary` grants SELECT to
 * NEITHER `anon` NOR `authenticated` — it returns 42501 for both. So the
 * designed fail-open ("gateway absent, or the device key failed → read the
 * base table") landed on a revoked relation and returned nothing: a blank
 * glossary rather than a degraded one. It is a live path, reached whenever
 * `keyFailedOpen` is set, not a theoretical one.
 *
 * `glossary_browse_v` is granted to `authenticated` and carries every column
 * both corpus queries read, including the formula pair that
 * `glossary_study_v` does not have. So it is the right read in BOTH cases:
 * when the gateway is deployed, and when it is not.
 *
 * The parameter is kept so the call sites still document which case they are
 * in, and so a future third relation has somewhere to go.
 */
export function corpusTable(_probe: GatewayProbe): 'glossary_browse_v' {
  return 'glossary_browse_v';
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
/**
 * A tap is waiting on this, so the deadline is much shorter than a submit's.
 * Long enough for a slow-but-working read; short enough that a tap never feels
 * dead.
 */
const DEFINITION_DEADLINE_MS = 8000;

export async function fetchDefinitionViaGateway(id: string): Promise<DefinitionResult> {
  try {
    /**
     * ⛔ BOUNDED — THIS IS THE LIVE METERING PATH (2026-09-23 overnight hunt).
     *
     * `glossaryCap.ts` was bounded on 2026-09-22, but that is the FALLBACK
     * meter. While `serverMeters` is true — i.e. the gateway view is deployed,
     * and it is — every term open goes through THIS RPC instead, and it was
     * unbounded. It also affects every tier including members, where the
     * fallback meter only ever ran for signed-in free users.
     *
     * The user-visible failure was the worst kind: `openPopupRoot` awaits this
     * and sets no loading flag, so a tap on a term produced literally nothing.
     * No popup, no spinner, no error. A 32,000-term glossary that appears dead
     * and gives the reader nothing to report.
     *
     * Timing out to `'error'` is the intended path, not a workaround — the
     * fault is documented in gatewayFault.ts as "Anything else: network,
     * timeout, unknown. Fail open", and openViaGateway then lets the legacy
     * read fill the detail. The term still opens.
     */
    // The meter is per DEVICE as well as per identity (owner 2026-09-25) —
    // see glossaryCap.ts. The id is read first so the deadline below covers
    // only the network.
    let p_device_id: string | null = null;
    try {
      p_device_id = await getDeviceId();
    } catch {
      p_device_id = null;
    }
    const { data, error } = await softDeadline(
      // `async () =>`: the Supabase builder is a thenable, not a Promise.
      async () => await supabase.rpc('get_glossary_definition', { p_id: id, p_device_id }),
      { data: null, error: { message: 'gateway timeout' } } as Awaited<
        ReturnType<typeof supabase.rpc<'get_glossary_definition'>>
      >,
      'get_glossary_definition',
      DEFINITION_DEADLINE_MS,
    );
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

// ── One charge per term per app session ───────────────────────────────────

/**
 * ⛔ A TERM ALREADY READ THIS SESSION IS FREE — ACROSS EVERY SURFACE (evening
 * hunt 2, 2026-10-02).
 *
 * The server charges EVERY `get_glossary_definition` call; it does not dedupe.
 * The term popup (labs, calculators) kept a once-per-session cache of its own,
 * but the Glossary screen's only memory of what it had read was per MOUNT —
 * and the Glossary is a pushed stack screen, so every visit started empty. A
 * free reader who opened "Headroom", went back, and opened the Glossary again
 * paid a second of their fourteen for the same term; a term read in a
 * calculator popup was paid again in the Glossary, and the reverse. That is
 * the owner's rule broken ("a term you already looked up this session doesn't
 * cost again", glossaryCap.ts).
 *
 * So both surfaces read through this one cache, keyed to the signed-in uid (a
 * sign-out, a new account or a re-minted guest key starts empty). Faults are
 * never kept. `member` (the screen passes the reader's standing) refuses a row
 * read under the OTHER standing — a free read masks Common Mistakes and a
 * member read does not — so joining or lapsing re-reads (a member's read is
 * never metered; a lapsed reader's is, as it should be). Callers that show no
 * member-only field (the popup) pass nothing.
 */
const READ_OK = new Map<string, GatewayDefinition>();
const READ_PENDING = new Map<string, Promise<DefinitionResult>>();
/**
 * SENT, POSSIBLY CHARGED, NEVER ANSWERED (owner ruling 2026-10-03 #1: opening
 * a term costs 1 lookup; once opened it is free for the session; sharing is
 * never an extra charge). A read that went out and came back as a plain
 * 'error' fault — the 12 s deadline, a dropped connection — may already have
 * been COUNTED by the server: it counts the call, not the answer. The open
 * path still retries (a fault is never kept, so a re-open asks again — that
 * is the reader asking for the definition), but SHARE must not be the thing
 * that spends a second lookup on a term the reader already paid to open.
 * Refusals ('limit-reached', 'sign-in-required', 'denied', 'not-deployed')
 * are not charges and are not recorded. Cleared by a good read of the term
 * and by any identity change, like READ_OK.
 */
const READ_UNANSWERED = new Set<string>();
let readsUid: string | null | undefined;
let readsGen = 0;
supabase.auth.onAuthStateChange((_e, session) => {
  const uid = session?.user?.id ?? null;
  if (uid !== readsUid) {
    READ_OK.clear();
    READ_PENDING.clear();
    READ_UNANSWERED.clear();
    readsGen += 1;
    readsUid = uid;
  }
});

/** A definition this session has already paid for, or null. A row read
 *  under the other standing (see above) does not count. */
export function sessionDefinition(id: string, member?: boolean): GatewayDefinition | null {
  const row = READ_OK.get(id);
  if (!row) return null;
  // A metered (free) read carries the week's count; a member's carries none.
  if (member !== undefined && (row.lim == null) !== member) return null;
  return row;
}

/** True when this session already SENT the metered read for `id` (so the
 *  server may have charged it) and no definition ever came back. A caller
 *  that must never spend a second lookup on the same term — SHARE — says the
 *  definition could not be loaded instead of reading again. */
export function sessionChargeUnanswered(id: string): boolean {
  return READ_UNANSWERED.has(id) && !READ_OK.has(id);
}

/** The metered read, at most once per term per session (per uid). */
export function readDefinitionOnce(id: string, member?: boolean): Promise<DefinitionResult> {
  const row = sessionDefinition(id, member);
  if (row) return Promise.resolve({ state: 'ok', row });
  const pending = READ_PENDING.get(id);
  if (pending) return pending;
  const gen = readsGen;
  const p = fetchDefinitionViaGateway(id).then((r) => {
    if (READ_PENDING.get(id) === p) READ_PENDING.delete(id);
    // Only for the identity that asked: an answer that lands after a sign-out
    // is the last reader's, and must not be served free to the next one.
    if (gen === readsGen) {
      if (r.state === 'ok') {
        READ_OK.set(id, r.row);
        READ_UNANSWERED.delete(id);
      } else if (r.fault === 'error') {
        READ_UNANSWERED.add(id);
      }
    }
    return r;
  });
  READ_PENDING.set(id, p);
  return p;
}
