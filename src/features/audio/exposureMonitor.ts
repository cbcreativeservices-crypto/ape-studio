/**
 * exposureMonitor — the Listening Exposure Monitor's centralized service
 * (owner spec 2026-08-12). ONE exposure timeline for the whole app.
 *
 * GROUND TRUTH, not screen visibility: a 1 s poller (armed ONLY while the
 * global audio-output gate is enabled — audio cannot sound otherwise) reads the
 * native voice statuses (generator / binaural / modular) and text-to-speech.
 * Any combination of simultaneous sources is ONE combined estimate per tick,
 * so layered voices can never double-count listening time (§30).
 *
 * HONESTY (§1.7 applied to exposure): without calibrated hardware the phone
 * cannot know ear-canal SPL. Active TIME is tracked exactly. LEVEL is an
 * estimate derived from the real source level (dBFS from the engine) plus a
 * user-adjustable reference point ("0 dBFS at your usual volume ≈ N dB SPL"),
 * and every reading is labeled with its confidence: 'calibrated' only after
 * the user sets their reference, otherwise 'general'. Nothing is ever labeled
 * measured in this build. Routes come from the ENGINE's real output route
 * (v4+); ambiguous routes report the safest general category, never a false
 * "headphones".
 *
 * DOSE: educational 3 dB exchange-rate model by default (85 dBA · 8 h = 100 %),
 * integrated tick-by-tick over the changing estimate — never a static
 * threshold. OSHA-style (90/5) and a conservative 80/3 model are selectable.
 * The daily dose persists across app restarts and resets at the local
 * calendar-day boundary; prior days keep their history (45-day retention).
 *
 * Backgrounding: the poller stops when the app is not active — exposure is
 * NEVER accumulated blindly while the OS may have suspended playback (§31).
 */
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { ApeDsp } from '../../../modules/ape-dsp';
import { isAudioOutputEnabled, isMicActive } from './audioOutputStore';
import { getSplCalibration } from '../tools/measure/calibrationStore';

// ── Types ────────────────────────────────────────────────────────────────────

export type ExposureStandard = 'niosh3' | 'osha5' | 'conservative3';
export type Confidence = 'calibrated' | 'general';
export type RouteKey = 'headphones' | 'bluetooth' | 'speaker' | 'external' | 'environmental' | 'unknown';

export type ExposureSettings = {
  enabled: boolean;
  /** Routine check-in interval in ACTIVE minutes; 0 = only elevated; -1 = off. */
  checkinMinutes: number;
  standard: ExposureStandard;
  /** Estimated SPL produced by 0 dBFS output at the user's usual volume. */
  refSplAt0Dbfs: number;
  /** True once the user has deliberately set the reference (confidence bump). */
  refCalibrated: boolean;
  /** Critical warnings (approaching/reached) — separate from routine check-ins. */
  criticalWarnings: boolean;
  advisoryWarnings: boolean;
  haptics: boolean;
  saveHistory: boolean;
  /** Session ends after this many minutes without audible output. */
  sessionGapMinutes: number;
};

export const DEFAULT_SETTINGS: ExposureSettings = {
  enabled: true,
  checkinMinutes: 15,
  standard: 'niosh3',
  refSplAt0Dbfs: 94,
  refCalibrated: false,
  criticalWarnings: true,
  advisoryWarnings: true,
  haptics: true,
  saveHistory: true,
  sessionGapMinutes: 5,
};

export type DayRecord = {
  date: string; // YYYY-MM-DD local
  activeSec: number;
  dose: number; // fraction of the daily recommended dose (1 = 100%)
  maxDb: number; // highest estimated level seen
  /** Energy accumulator for the day's Leq: Σ 10^(L/10)·dt (seconds-weighted). */
  energySum: number;
  routeSec: Record<RouteKey, number>;
  checkins: number;
  warnings: number;
  sessions: { startMs: number; endMs: number; activeSec: number; maxDb: number; route: RouteKey }[];
  longestSessionSec: number;
};

export type CheckinKind = 'routine' | 'advisory' | 'approaching' | 'reached';

export type ExposureSnapshot = {
  enabled: boolean;
  /** Audio audibly active RIGHT NOW (this tick). */
  soundingNow: boolean;
  sessionActiveSec: number;
  sessionMaxDb: number;
  sessionStartMs: number | null;
  todayActiveSec: number;
  todayDose: number;
  todayMaxDb: number;
  /** Energy-average (Leq-style) estimated level for today, or null (no data). */
  todayAvgDb: number | null;
  currentDb: number | null; // estimated/measured level while active, else null
  route: RouteKey;
  routeLabel: string;
  confidence: Confidence;
  /** True when the current level is a field-calibrated MIC measurement (not an
   *  output estimate) — the one case the app may call a reading "measured". */
  measured: boolean;
  /** Estimated recommended seconds remaining at the current level (null = n/a). */
  remainingSec: number | null;
  checkinsToday: number;
  settings: ExposureSettings;
};

// ── Dose math (pure — kept extractable for host-side tests) ──────────────────

/** Allowable exposure seconds at level L for a standard (Inf below the floor). */
export function allowableSec(db: number, standard: ExposureStandard): number {
  const [ref, rate, floor] =
    standard === 'osha5' ? [90, 5, 80] : standard === 'conservative3' ? [80, 3, 65] : [85, 3, 70];
  if (db < floor) return Infinity; // negligible contribution below the model floor
  return 8 * 3600 * Math.pow(2, (ref - db) / rate);
}

export const STANDARD_LABELS: Record<ExposureStandard, string> = {
  niosh3: 'Recommended · 85 dBA / 8 h · 3 dB exchange',
  osha5: 'Occupational-style · 90 dBA / 8 h · 5 dB exchange',
  conservative3: 'Conservative · 80 dBA / 8 h · 3 dB exchange',
};

export const ROUTE_LABELS: Record<RouteKey, string> = {
  headphones: 'Wired headphones',
  bluetooth: 'Bluetooth audio device',
  speaker: 'Device speaker',
  external: 'External audio output',
  environmental: 'Environmental (microphone)',
  unknown: 'Output route unknown',
};

/** Map the engine's native route string to the safest accurate category (§7):
 *  Bluetooth is NEVER assumed to be headphones. */
function routeFromNative(r: string | undefined): RouteKey {
  if (!r) return 'unknown';
  const s = r.toLowerCase();
  if (s.includes('headphone') || s.includes('headset')) return 'headphones';
  if (s.includes('bluetooth') || s.includes('a2dp')) return 'bluetooth';
  if (s.includes('speaker')) return 'speaker';
  if (s.includes('line') || s.includes('usb') || s.includes('hdmi') || s.includes('airplay')) return 'external';
  return 'unknown';
}

const dateKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Assumed source levels (dBFS) for voices whose live level isn't exposed.
const BIN_MOD_DBFS = -20; // both voices run under the same Q4 default cap chain
const TTS_DBFS = -16;
const NEGLIGIBLE_DBFS = -60; // below this the output is treated as inaudible (§2.3)

// INCOMING (mic-measured environmental) exposure — the dosimeter tracks BOTH
// what the app plays AND what the microphone hears while you monitor (owner
// 2026-08-12): using the SPL meter at a concert IS exposure, not an option. The
// mic is already running/authorized for the measurement tool; we just read the
// A-weighted level it already produces. dB SPL = aFastDb + calOffset (measured,
// field-calibrated) or + the nominal estimate (matches the SPL meter's own
// uncalibrated 0 dBFS ≈ 100 dB SPL assumption).
const INPUT_NOMINAL_OFFSET = 100;
const INPUT_FLOOR_SPL = 45; // below this the environment is not meaningful exposure

// ── Store state ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'ape:exposure:v1:settings';
const DAY_KEY = (date: string) => `ape:exposure:v1:day:${date}`;
const INDEX_KEY = 'ape:exposure:v1:days';
const RETAIN_DAYS = 45;

let settings: ExposureSettings = { ...DEFAULT_SETTINGS };
let day: DayRecord | null = null;
let hydrated = false;

let sounding = false;
let soundingStreak = 0; // consecutive active ticks (2 needed to open a session)
let pendingSec = 0; // active seconds seen before the session officially opens
let currentDb: number | null = null;
let route: RouteKey = 'unknown';
let currentMeasured = false; // true when the live level is a field-calibrated mic measurement
let session: { startMs: number; activeSec: number; maxDb: number; lastActiveMs: number } | null = null;
let ttsSpeaking = false;
let elevatedSec = 0; // consecutive active seconds at/above the advisory level
let advisoryFiredThisSession = false;
let approachingFiredToday = false;
let reachedFiredToday = false;
let lastPersistMs = 0;

let timer: ReturnType<typeof setInterval> | null = null;
let appActive = true;

const stateListeners = new Set<() => void>();
const checkinListeners = new Set<(kind: CheckinKind, snap: ExposureSnapshot) => void>();

function emitState() {
  stateListeners.forEach((l) => l());
}
function emitCheckin(kind: CheckinKind) {
  const snap = getExposureSnapshot();
  checkinListeners.forEach((l) => l(kind, snap));
}

function freshDay(date: string): DayRecord {
  return {
    date,
    activeSec: 0,
    dose: 0,
    maxDb: 0,
    energySum: 0,
    routeSec: { headphones: 0, bluetooth: 0, speaker: 0, external: 0, environmental: 0, unknown: 0 },
    checkins: 0,
    warnings: 0,
    sessions: [],
    longestSessionSec: 0,
  };
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const [rawS, rawIdx] = await Promise.all([AsyncStorage.getItem(SETTINGS_KEY), AsyncStorage.getItem(INDEX_KEY)]);
    if (rawS) settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(rawS) as Partial<ExposureSettings>) };
    const today = dateKeyOf(new Date());
    const rawDay = await AsyncStorage.getItem(DAY_KEY(today));
    day = rawDay ? (JSON.parse(rawDay) as DayRecord) : freshDay(today);
    // prune old days beyond retention
    if (rawIdx) {
      const idx = JSON.parse(rawIdx) as string[];
      const keep = idx.filter((d) => d >= dateKeyOf(new Date(Date.now() - RETAIN_DAYS * 86400000)));
      const drop = idx.filter((d) => !keep.includes(d));
      if (drop.length) {
        await Promise.all(drop.map((d) => AsyncStorage.removeItem(DAY_KEY(d))));
        await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(keep));
      }
    }
  } catch {
    day = day ?? freshDay(dateKeyOf(new Date()));
  }
  emitState();
}

async function persistDay(force = false): Promise<void> {
  if (!day || !settings.saveHistory) return;
  const now = Date.now();
  if (!force && now - lastPersistMs < 15000) return; // batch writes
  lastPersistMs = now;
  try {
    await AsyncStorage.setItem(DAY_KEY(day.date), JSON.stringify(day));
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    const idx = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    if (!idx.includes(day.date)) {
      idx.push(day.date);
      idx.sort();
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    }
  } catch {
    /* persistence is best-effort; live monitoring continues */
  }
}

function persistSettings(): void {
  void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Close the open session into the day record. */
function closeSession(endMs: number): void {
  if (!session || !day) {
    session = null;
    return;
  }
  if (session.activeSec >= 5) {
    day.sessions.push({
      startMs: session.startMs,
      endMs,
      activeSec: session.activeSec,
      maxDb: session.maxDb,
      route,
    });
    if (day.sessions.length > 60) day.sessions = day.sessions.slice(-60);
    if (session.activeSec > day.longestSessionSec) day.longestSessionSec = session.activeSec;
  }
  session = null;
  elevatedSec = 0;
  advisoryFiredThisSession = false;
  void persistDay(true);
}

/** Roll to a new local day if the calendar date changed (midnight/timezone). */
function rollDayIfNeeded(): void {
  const today = dateKeyOf(new Date());
  if (day && day.date === today) return;
  if (day) void persistDay(true);
  day = freshDay(today);
  approachingFiredToday = false;
  reachedFiredToday = false;
  void persistDay(true);
}

/** The single ear-exposure estimate for this tick — the LOUDER of what the app
 *  is PLAYING (estimated from the real source dBFS + the output reference) and
 *  what the mic is MEASURING while a tool monitors (dB SPL, measured when
 *  field-calibrated). Max, never a sum: two simultaneous sources are one
 *  acoustic exposure, never two listening durations (§30). */
function readSources(): { active: boolean; db: number | null; rt: RouteKey; measured: boolean } {
  // ── Output (playback) ──
  let outDbfs = -Infinity;
  if (ApeDsp.isAvailable()) {
    const gen = ApeDsp.genStatus();
    if (gen?.running && gen.effectiveLevelDb > NEGLIGIBLE_DBFS) outDbfs = Math.max(outDbfs, gen.effectiveLevelDb);
    if (ApeDsp.binStatus()?.running) outDbfs = Math.max(outDbfs, BIN_MOD_DBFS);
    if (ApeDsp.modStatus()?.running) outDbfs = Math.max(outDbfs, BIN_MOD_DBFS);
  }
  if (ttsSpeaking) outDbfs = Math.max(outDbfs, TTS_DBFS);
  const outDb = outDbfs > -Infinity ? Math.round((settings.refSplAt0Dbfs + outDbfs) * 10) / 10 : null;
  const outRoute = outDb != null ? routeFromNative(ApeDsp.getInfo()?.outputRoute) : 'unknown';

  // ── Incoming (mic-measured environmental) ──
  let inDb: number | null = null;
  let inMeasured = false;
  if (isMicActive() && ApeDsp.isAvailable()) {
    const f = ApeDsp.getMeterFrame();
    if (f?.running && Number.isFinite(f.aFastDb)) {
      const cal = getSplCalibration();
      const spl = Math.round((f.aFastDb + (cal?.offsetDb ?? INPUT_NOMINAL_OFFSET)) * 10) / 10;
      if (spl >= INPUT_FLOOR_SPL) {
        inDb = spl;
        inMeasured = cal != null;
      }
    }
  }

  if (outDb == null && inDb == null) return { active: false, db: null, rt: 'unknown', measured: false };
  if (inDb != null && (outDb == null || inDb >= outDb)) return { active: true, db: inDb, rt: 'environmental', measured: inMeasured };
  return { active: true, db: outDb, rt: outRoute, measured: false };
}

/** One 1 s tick of the monitor. */
function tick(): void {
  if (!settings.enabled || !day) return;
  rollDayIfNeeded();
  const now = Date.now();

  // TTS status refresh (async — applies next tick; 1 s staleness is fine).
  void Speech.isSpeakingAsync()
    .then((v) => {
      ttsSpeaking = v;
    })
    .catch(() => {
      ttsSpeaking = false;
    });

  const src = readSources();
  sounding = src.active;

  if (src.active) {
    soundingStreak += 1;
    currentDb = src.db;
    route = src.rt;
    currentMeasured = src.measured;
    const lvl = src.db ?? 0; // non-null while active; ?? satisfies the type

    // Sub-second taps / one-shot cues never open a session (§2.4): require two
    // consecutive audible ticks before counting begins (the first tick is
    // retro-credited so no real listening time is lost).
    if (!session) {
      if (soundingStreak < 2) {
        pendingSec = 1;
        emitState();
        return;
      }
      session = { startMs: now - pendingSec * 1000, activeSec: pendingSec, maxDb: 0, lastActiveMs: now };
    }

    const dt = 1; // seconds
    session.activeSec += dt;
    session.lastActiveMs = now;
    if (lvl > session.maxDb) session.maxDb = lvl;

    const d = day;
    d.activeSec += dt;
    if (lvl > d.maxDb) d.maxDb = lvl;
    d.energySum += Math.pow(10, lvl / 10) * dt;
    d.routeSec[route] = (d.routeSec[route] ?? 0) + dt; // ?? guards pre-'environmental' records
    const allow = allowableSec(lvl, settings.standard);
    if (Number.isFinite(allow)) d.dose += dt / allow;

    // Routine check-in: fires each time TODAY's active minutes cross a multiple
    // of the interval (active time, not clock time — §4).
    if (settings.checkinMinutes > 0) {
      const intSec = settings.checkinMinutes * 60;
      if (d.activeSec % intSec === 0) {
        d.checkins += 1;
        emitCheckin('routine');
      }
    }

    // Advisory: sustained elevated level (≥88 dBA for 5 min), once/session.
    if (lvl >= 88) {
      elevatedSec += dt;
      if (settings.advisoryWarnings && !advisoryFiredThisSession && elevatedSec >= 300) {
        advisoryFiredThisSession = true;
        d.warnings += 1;
        emitCheckin('advisory');
      }
    } else {
      elevatedSec = 0;
    }

    // Critical dose warnings — separate control, once each per day (§17).
    if (settings.criticalWarnings) {
      if (!approachingFiredToday && d.dose >= 0.8 && d.dose < 1) {
        approachingFiredToday = true;
        d.warnings += 1;
        emitCheckin('approaching');
      }
      if (!reachedFiredToday && d.dose >= 1) {
        reachedFiredToday = true;
        d.warnings += 1;
        emitCheckin('reached');
      }
    }

    void persistDay();
  } else {
    soundingStreak = 0;
    pendingSec = 0;
    currentDb = null;
    // End the session after the configured quiet gap (short pauses don't reset).
    if (session && now - session.lastActiveMs > settings.sessionGapMinutes * 60000) closeSession(now);
  }
  emitState();
}

function startTimer(): void {
  if (timer) return;
  timer = setInterval(tick, 1000);
}
function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // Never accumulate blindly: leaving the foreground (or the output gate
  // closing) ends the audible state now; the open session closes on the normal
  // quiet-gap rule when we return.
  sounding = false;
  currentDb = null;
  soundingStreak = 0;
  emitState();
}

/** Arm/disarm from the gates: app foregrounded AND (output can sound OR the mic
 *  is capturing for a measurement tool). The poller ONLY exists while there is
 *  real exposure to track — zero background battery cost otherwise. The output
 *  store's emit fires on BOTH output-enable and mic-active changes, so the one
 *  subscribeAudioOutput hook re-evaluates for both. */
function evaluateArm(): void {
  if (settings.enabled && appActive && (isAudioOutputEnabled() || isMicActive())) startTimer();
  else stopTimer();
}

/** Boot the monitor once from the app root. Idempotent. */
let booted = false;
export function initExposureMonitor(subscribeOutput: (cb: () => void) => void): void {
  if (booted) return;
  booted = true;
  void hydrate().then(evaluateArm);
  subscribeOutput(evaluateArm);
  AppState.addEventListener('change', (st: AppStateStatus) => {
    appActive = st === 'active';
    if (!appActive && day) void persistDay(true);
    evaluateArm();
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getExposureSnapshot(): ExposureSnapshot {
  const d = day;
  const avg = d && d.activeSec > 0 ? Math.round(10 * Math.log10(d.energySum / d.activeSec) * 10) / 10 : null;
  let remaining: number | null = null;
  if (d) {
    const level = currentDb ?? avg;
    if (level != null) {
      const allow = allowableSec(level, settings.standard);
      remaining = Number.isFinite(allow) ? Math.max(0, (1 - d.dose) * allow) : null;
    }
  }
  return {
    enabled: settings.enabled,
    soundingNow: sounding,
    sessionActiveSec: session?.activeSec ?? 0,
    sessionMaxDb: session?.maxDb ?? 0,
    sessionStartMs: session?.startMs ?? null,
    todayActiveSec: d?.activeSec ?? 0,
    todayDose: d?.dose ?? 0,
    todayMaxDb: d?.maxDb ?? 0,
    todayAvgDb: avg,
    currentDb,
    route,
    routeLabel:
      route === 'environmental'
        ? currentMeasured
          ? 'Environmental · field-calibrated'
          : 'Environmental (microphone) · estimated'
        : ROUTE_LABELS[route],
    confidence:
      route === 'environmental'
        ? currentMeasured
          ? 'calibrated'
          : 'general'
        : settings.refCalibrated
          ? 'calibrated'
          : 'general',
    measured: route === 'environmental' && currentMeasured,
    remainingSec: remaining,
    checkinsToday: d?.checkins ?? 0,
    settings,
  };
}

export function subscribeExposure(cb: () => void): () => void {
  stateListeners.add(cb);
  return () => {
    stateListeners.delete(cb);
  };
}

export function onExposureCheckin(cb: (kind: CheckinKind, snap: ExposureSnapshot) => void): () => void {
  checkinListeners.add(cb);
  return () => {
    checkinListeners.delete(cb);
  };
}

export function updateExposureSettings(patch: Partial<ExposureSettings>): void {
  settings = { ...settings, ...patch };
  persistSettings();
  evaluateArm();
  emitState();
}

export async function getExposureHistory(): Promise<DayRecord[]> {
  try {
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    const idx = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    const today = dateKeyOf(new Date());
    const keys = idx.filter((d) => d !== today);
    const rows = await Promise.all(keys.map((k) => AsyncStorage.getItem(DAY_KEY(k))));
    const out = rows.filter((r): r is string => r != null).map((r) => JSON.parse(r) as DayRecord);
    if (day) out.push(day);
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return day ? [day] : [];
  }
}

export async function deleteExposureToday(): Promise<void> {
  const today = dateKeyOf(new Date());
  day = freshDay(today);
  session = null;
  approachingFiredToday = false;
  reachedFiredToday = false;
  await AsyncStorage.removeItem(DAY_KEY(today)).catch(() => {});
  emitState();
}

export async function deleteExposureHistory(): Promise<void> {
  try {
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    const idx = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    await Promise.all(idx.map((d) => AsyncStorage.removeItem(DAY_KEY(d))));
    await AsyncStorage.removeItem(INDEX_KEY);
  } catch {
    /* best-effort */
  }
  await deleteExposureToday();
}

/** Serialized history for the user's own export (privacy §22). */
export async function exportExposureHistory(): Promise<string> {
  const rows = await getExposureHistory();
  return JSON.stringify(
    { exported: new Date().toISOString(), standard: settings.standard, note: 'Educational exposure estimates — not medical or compliance measurements.', days: rows },
    null,
    2,
  );
}

// ── Formatting helpers (shared by the panel, strip and screen) ───────────────

export function fmtDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} hr ${m % 60 > 0 ? `${m % 60} min` : ''}`.trim();
}

/** Remaining-time wording with confidence-appropriate rounding (§12). */
export function fmtRemaining(sec: number | null, confidence: Confidence, dose: number): string {
  if (dose >= 1) return 'Recommended dose reached';
  if (sec == null) return 'Unavailable until a level is estimated';
  if (sec < 300) return 'Less than 5 min';
  const rounded = Math.round(sec / 300) * 300; // 5-minute steps — no false precision
  const text = fmtDuration(rounded);
  return confidence === 'calibrated' ? text : `About ${text}`;
}

/** Contextual status line for the check-in (§6 tone rules). */
export function exposureMessage(snap: ExposureSnapshot): string {
  const pct = Math.round(snap.todayDose * 100);
  if (snap.todayDose >= 1)
    return `Your estimated daily exposure has reached ${pct}%. Continued listening at this level may increase hearing risk.`;
  if (snap.todayDose >= 0.8)
    return 'You are approaching your recommended daily exposure. Reduce the level or take a listening break.';
  if ((snap.currentDb ?? 0) >= 88)
    return 'Your estimated listening level has been elevated. Consider lowering the level or taking a quiet break.';
  if (snap.todayDose >= 0.25)
    return `You have been listening for ${fmtDuration(snap.todayActiveSec)}. ${fmtRemaining(snap.remainingSec, snap.confidence, snap.todayDose)} of recommended exposure remain at the current estimate.`;
  return `Your exposure remains low. You have used approximately ${Math.max(1, pct)}% of today’s recommended dose.`;
}

export const EXPOSURE_HONESTY_LINE =
  'Tracks BOTH what the app plays (estimated) and what the microphone measures while you monitor (measured when field-calibrated). Actual level at your ear depends on your device, headphones, fit and source. Not a medical or compliance measurement.';
