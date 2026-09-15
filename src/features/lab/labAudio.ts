/**
 * labAudio — client fetch layer for lab audio assets (batch-1 wiring,
 * 2026-09-15). Backend contract & mapping: docs/CCODE_LAB_AUDIO_WIRING_HANDOFF_
 * 2026_09_15.md + docs/CCODE_LAB_AUDIO_MAPPING_REPLY_2026-09-15.md.
 *
 * A lab asset lives in the PRIVATE `lab-audio` bucket; the client never builds a
 * URL. It calls the `lab-audio` Edge Function with (lab_key, asset_key); the
 * function returns a short-lived (120 s) SIGNED URL plus the asset's metadata.
 * `supabase.functions.invoke` attaches the current session's access token
 * automatically, so `free`/`academy` assets validate server-side — batch-1 rows
 * are all `public`, which need no token (gating is at the lab-access level, not
 * the audio). Same shape as `tube-image` (see tubeRefs.ts:fetchTubePage).
 *
 * The signed URL expires in 120 s, so this is fetched at PLAY time, never
 * cached long — see LabAudioPlayer.
 */
import { supabase } from '../../lib/supabase';

export type LabAudioTier = 'public' | 'free' | 'academy';

/** Metadata + the short-lived signed URL for one asset. */
export interface LabAudioAsset {
  /** Signed URL, ~120 s TTL. Stream it, don't persist it. */
  url: string;
  ext: string;
  durationMs: number;
  samplerate: number;
  channels: number;
  accessTier: LabAudioTier;
}

/** Why a fetch resolved the way it did — lets a lab distinguish "not entitled"
 *  (a RETRY can't fix) from "network" (it can) from "no such asset". */
export type LabAudioReason = 'ok' | 'auth' | 'not_found' | 'network';

export interface LabAudioResult {
  asset: LabAudioAsset | null;
  reason: LabAudioReason;
}

/** Raw success body from the edge fn (snake_case, as documented in §3). */
interface LabAudioResponse {
  url?: string;
  ext?: string;
  duration_ms?: number;
  samplerate?: number;
  channels?: number;
  access_tier?: string;
}

function asTier(v: string | undefined): LabAudioTier {
  return v === 'free' || v === 'academy' ? v : 'public';
}

/**
 * Fetch a signed URL + metadata for one lab asset. Never throws — returns a
 * null asset with a reason on any failure. `auth` = signed out / no active
 * academy entitlement (401/403); `not_found` = no published row for that
 * (lab_key, asset_key) (404); `network` = anything else (offline, 5xx).
 */
export async function fetchLabAudio(labKey: string, assetKey: string): Promise<LabAudioResult> {
  try {
    const { data, error } = await supabase.functions.invoke('lab-audio', {
      body: { lab_key: labKey, asset_key: assetKey },
    });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 401 || status === 403) return { asset: null, reason: 'auth' };
      if (status === 404) return { asset: null, reason: 'not_found' };
      return { asset: null, reason: 'network' };
    }
    const body = (data as LabAudioResponse | null) ?? {};
    if (!body.url) return { asset: null, reason: 'network' };
    return {
      asset: {
        url: body.url,
        ext: body.ext ?? 'wav',
        durationMs: body.duration_ms ?? 0,
        samplerate: body.samplerate ?? 0,
        channels: body.channels ?? 0,
        accessTier: asTier(body.access_tier),
      },
      reason: 'ok',
    };
  } catch {
    return { asset: null, reason: 'network' };
  }
}
