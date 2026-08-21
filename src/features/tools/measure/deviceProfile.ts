/**
 * deviceProfile — the client foundation for the crowdsourced microphone catalog
 * (owner 2026-08-21; plan: docs/CROWDSOURCED_MIC_CATALOG_PLAN_2026_08_21.md).
 *
 * TWO tiers, ONE record shape:
 *  • Tier A — a Device Microphone Capability Record: what the device itself
 *    reports (capture path, sample rate, route, and — once the native batch
 *    lands — model + Android MicrophoneInfo). Zero user effort, no reference.
 *  • Tier B — a CalibrationContribution: the user's single dBFS→SPL offset plus a
 *    reference-quality tag, keyed by device, for per-model median aggregation.
 *
 * SAFETY INVARIANTS (do not weaken):
 *  - NOTHING leaves the device from here. This module only BUILDS records and
 *    QUEUES contributions locally. Upload is a separate, consent-gated last mile
 *    that does not exist yet (owner: build wiring now, ship post-launch).
 *  - Contributions are anonymous: a random contributionId, NEVER an account id,
 *    name, email, precise location, or device serial. NEVER raw audio.
 *  - Consent is OPT-IN, default OFF (`hasCrowdsourceConsent`), and re-checked at
 *    the moment of any future upload — a queued contribution is not a promise to
 *    send; the user can revoke and the queue is cleared.
 *  - A community offset, when it eventually comes back, is a SUGGESTED starting
 *    point, never applied as truth (no-fake-corrections — see the plan).
 *
 * Model + MicrophoneInfo arrive with the native batch (Android getMicrophoneInfo
 * + a device-model getter); until then those fields are null and the record is
 * still valid + versioned, so old records are re-aggregated on schema bumps.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import type { DspInfo } from '../../../../modules/ape-dsp';

/** Bump when the record/contribution shape or capture semantics change — the
 *  aggregator re-buckets by this so stale-shape data never mixes with fresh. */
export const PROFILE_SCHEMA_VERSION = 1;

const QUEUE_KEY = 'ape:crowdsource:queue';
const CONSENT_KEY = 'ape:crowdsource:consent';

/** How the user established their reference during calibration — weights the
 *  contribution in aggregation (calibrator ≫ meter ≫ app ≫ eyeballed). */
export type ReferenceQuality = 'calibrator' | 'type1_2_meter' | 'consumer_app' | 'eyeballed';

/** Android MicrophoneInfo snapshot (API 28+) — MANUFACTURER-declared values;
 *  useful for sanity-checking + factory starting profiles, never a substitute
 *  for calibration. All fields nullable/unknown. Filled by the native batch. */
export type MicInfo = {
  /** dBFS produced by a 94 dB SPL / 1 kHz input (Android's sensitivity def). */
  sensitivityDbFs: number | null;
  /** Declared frequency response as [hz, db] pairs, or null when unknown. */
  frequencyResponse: [number, number][] | null;
  /** DIRECT (raw) vs PROCESSED active-capture channel mapping. */
  channelMapping: 'direct' | 'processed' | 'unknown';
  directionality: string | null;
  /** Manufacturer mic id/address — stable identity for the SAME physical mic. */
  address: string | null;
};

/** The identity a profile/contribution is keyed by. A capture-mode or profile
 *  bump starts a fresh key so a stale offset never leaks across a path change. */
export type DeviceKey = {
  platform: 'ios' | 'android' | string;
  /** e.g. "Pixel 8 Pro" / "iPhone17,1" — native-filled; null until the batch. */
  model: string | null;
  osVersion: string | null;
  osBuild: string | null;
  appVersion: string;
  engineVersion: number | null;
  /** True = an unprocessed/.measurement path was verified (measurement-grade). */
  measurementGrade: boolean;
  inputPortType: string;
  profileVersion: number;
};

/** Tier A — the device's self-reported capability record (no reference needed). */
export type DeviceCapabilityRecord = {
  deviceKey: DeviceKey;
  sampleRate: number | null;
  ioBufferDuration: number | null;
  routeName: string;
  micInfo: MicInfo | null;
  noiseFloorDb: number | null;
  capturedAt: string;
};

/** Tier B — one anonymous calibration contribution (queued locally until an
 *  opt-in, reviewed upload path exists). */
export type CalibrationContribution = {
  schemaVersion: number;
  /** Random + anonymous. NOT an account id. */
  contributionId: string;
  deviceKey: DeviceKey;
  /** The dB the user added to dBFS to read dB SPL (the calibrationStore offset). */
  offsetDb: number;
  /** What the user started from (usually NOMINAL_OFFSET) — context for spread. */
  nominalStart: number;
  referenceQuality: ReferenceQuality;
  micInfo: MicInfo | null;
  noiseFloorDb: number | null;
  sampleRate: number | null;
  createdAt: string;
};

const nowIso = (): string => new Date().toISOString();
const appVersion = (): string => Constants.expoConfig?.version ?? '0.0.0';

/** Build the device key from the engine's info surface (`ApeDsp.getInfo()`).
 *  `model`/`osBuild` come from the native batch — null-safe until then. */
export function buildDeviceKey(info: DspInfo | null, native?: Partial<Pick<DeviceKey, 'model' | 'osVersion' | 'osBuild'>>): DeviceKey {
  return {
    platform: Platform.OS,
    model: native?.model ?? null,
    osVersion: native?.osVersion ?? (Platform.Version != null ? String(Platform.Version) : null),
    osBuild: native?.osBuild ?? null,
    appVersion: appVersion(),
    engineVersion: info?.engineVersion ?? null,
    measurementGrade: info?.measurementMode ?? false,
    inputPortType: info?.inputPortType ?? '',
    profileVersion: PROFILE_SCHEMA_VERSION,
  };
}

/** Build the Tier A capability record. `micInfo`/`noiseFloorDb` are optional —
 *  supplied by the native mic-info batch and a quiet-moment noise estimate. */
export function buildCapabilityRecord(
  info: DspInfo | null,
  opts?: { micInfo?: MicInfo | null; noiseFloorDb?: number | null; native?: Parameters<typeof buildDeviceKey>[1] },
): DeviceCapabilityRecord {
  return {
    deviceKey: buildDeviceKey(info, opts?.native),
    sampleRate: info?.sampleRate ?? null,
    ioBufferDuration: info?.ioBufferDuration ?? null,
    routeName: info?.routeName ?? '',
    micInfo: opts?.micInfo ?? null,
    noiseFloorDb: opts?.noiseFloorDb ?? null,
    capturedAt: nowIso(),
  };
}

/** Assemble an anonymous Tier B contribution from a completed calibration. Pure
 *  — it does NOT persist or send; callers queue it via `queueContribution`. */
export function makeContribution(args: {
  record: DeviceCapabilityRecord;
  offsetDb: number;
  nominalStart: number;
  referenceQuality: ReferenceQuality;
}): CalibrationContribution {
  const { record, offsetDb, nominalStart, referenceQuality } = args;
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    contributionId: Crypto.randomUUID(),
    deviceKey: record.deviceKey,
    offsetDb,
    nominalStart,
    referenceQuality,
    micInfo: record.micInfo,
    noiseFloorDb: record.noiseFloorDb,
    sampleRate: record.sampleRate,
    createdAt: nowIso(),
  };
}

// ── Consent (opt-in, default OFF) ──────────────────────────────────────────

/** Whether the user has opted in to contribute anonymized calibration data.
 *  Default false. Checked again at upload time (a queued item is not consent). */
export async function hasCrowdsourceConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CONSENT_KEY)) === '1';
  } catch {
    return false;
  }
}

/** Set the opt-in flag. Revoking (false) also clears any queued contributions —
 *  nothing already collected should survive a withdrawal of consent. */
export async function setCrowdsourceConsent(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, on ? '1' : '0');
    if (!on) await clearContributionQueue();
  } catch {
    /* best-effort — never throw from a consent write */
  }
}

// ── Local contribution queue (no network) ──────────────────────────────────

/** Queue a contribution locally. No-op unless the user has opted in — we never
 *  even STORE a contribution without consent. Returns whether it was queued. */
export async function queueContribution(c: CalibrationContribution): Promise<boolean> {
  if (!(await hasCrowdsourceConsent())) return false;
  try {
    const q = await getQueuedContributions();
    q.push(c);
    // Keep only the most recent per device key (a fresh calibration supersedes
    // the user's earlier one — we contribute their CURRENT belief, not a history).
    const byKey = new Map<string, CalibrationContribution>();
    for (const item of q) byKey.set(keyString(item.deviceKey), item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...byKey.values()]));
    return true;
  } catch {
    return false;
  }
}

export async function getQueuedContributions(): Promise<CalibrationContribution[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as CalibrationContribution[]) : [];
  } catch {
    return [];
  }
}

export async function clearContributionQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    /* best-effort */
  }
}

/** Stable string form of a device key for de-duplication/bucketing. */
export function keyString(k: DeviceKey): string {
  return [k.platform, k.model ?? '?', k.osBuild ?? '?', k.measurementGrade ? 'meas' : 'proc', k.inputPortType || '?', `v${k.profileVersion}`].join('|');
}
