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
import { frameIsLive } from '../tools/engine/useDspEngine';
import { isAudioOutputEnabled, isMicActive } from './audioOutputStore';
import { getSplCalibration } from '../tools/measure/calibrationStore';
import { areOverlaysSuppressed } from '../dev/popupSuppressStore';
import { createLocalStore } from '../storage/localStore';

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
  /** True when the mic capture dropped/overran samples during THIS session while
   *  it was the measured source (Phase 1 A1): the integrated dose spanned a gap,
   *  so it's an under-estimate — disclosed, never silently trusted. */
  hadGap: boolean;
  /** Today's stored dose could not be read (storage failed). The figures
   *  above are this run's listening only, held and ADDED to the stored day
   *  once a read succeeds — never a reset to zero. */
  doseUnreadable: boolean;
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

/** LOCAL Y-M-D key every stored day is filed under. Exported so screens key
 *  "today" the same way the store does (a UTC key drifts a day east of UTC). */
export const dateKeyOf = (d: Date) =>
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
// TRACKING vs DOSE (owner 2026-09-05): while the mic is capturing for a tool
// the monitor is ACTIVE — time ticks and the readout shows that tracking is
// live — even in a quiet room. Faint levels simply contribute no dose: every
// model's floor (65/70/80 dBA) already makes allowableSec() infinite there.
// The old 45 dB SPL gate made a quiet room look like "not tracking at all".

// ── Store state ──────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'ape:exposure:v1:settings';
const DAY_KEY = (date: string) => `ape:exposure:v1:day:${date}`;
const INDEX_KEY = 'ape:exposure:v1:days';
const RETAIN_DAYS = 45;

/**
 * The settings live on the shared safe store (pattern catalog 2026-10-02,
 * closer A2; wave 2). A read that FAILED used to leave the defaults in place,
 * and the next settings change saved defaults-plus-that-change over the
 * user's standard, reference level and check-in choices. Now a failed read
 * leaves the store unreadable: the monitor runs on the DEFAULTS meanwhile —
 * tracking ON, every warning ON, the recommended standard, which is the safe
 * direction for a hearing-safety tool — and a change made meanwhile is held
 * and written on top of the stored settings once a read succeeds.
 */
const settingsStore = createLocalStore<ExposureSettings>({
  key: SETTINGS_KEY,
  empty: () => ({ ...DEFAULT_SETTINGS }),
  parse: (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('exposure settings are not an object');
    return { ...DEFAULT_SETTINGS, ...(raw as Partial<ExposureSettings>) };
  },
});
/** The settings as the monitor should apply them right now. */
const cfg = (): ExposureSettings => settingsStore.get();

let day: DayRecord | null = null;
let hydrated = false;
let hydrating: Promise<void> | null = null;
/**
 * ⛔ TODAY'S STORED DOSE COULD NOT BE READ (pattern catalog 2026-10-02, P1).
 *
 * A failed read used to start a FRESH day — dose 0 % — and the 15-second
 * flush then wrote that fresh day over the stored one: a listener at 90 % of
 * their daily dose was told they were at 0 %, and the record of the morning
 * was gone for good. For a hearing-safety figure that is the worst direction
 * there is (an under-report turns off the warnings that matter).
 *
 * Now a read that throws leaves the day UNREADABLE: this run's listening is
 * still tracked (exposure is never ignored) in a held day, nothing is written
 * over the stored copy, the flush reads again instead of writing, and the
 * first read that succeeds ADDS the held listening to the stored day. The
 * snapshot says so (`doseUnreadable`) so a screen can say "earlier listening
 * could not be read" rather than show a confident low number.
 */
let dayReadFailed = false;
/** Bumped by resetLocal (the account wipe). A read or write that started under
 *  the departing listener lands nowhere (the generation fence, catalog P3). */
let generation = 0;

let sounding = false;
let soundingStreak = 0; // consecutive active ticks (2 needed to open a session)
let pendingSec = 0; // active seconds seen before the session officially opens
let currentDb: number | null = null;
let route: RouteKey = 'unknown';
let currentMeasured = false; // true when the live level is a field-calibrated mic measurement
let session: { startMs: number; activeSec: number; maxDb: number; lastActiveMs: number } | null = null;
// Mic-capture continuity for exposure (Phase 1 A1): droppedFrames is a monotonic
// per-capture counter; a NEW drop while the mic is the measured source means the
// dose integral spanned a gap. `sessionHadGap` latches for the session (disclosed
// in the snapshot), reset when a session opens/closes.
let lastMicDropped = 0;
let sessionHadGap = false;
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

/**
 * Drop the in-memory dose state on sign-out / account switch (fix 2026-08-28).
 *
 * `clearLocalAccountData` already sweeps the `ape:exposure:v1:*` KEYS — this
 * module is classified as user data — but nothing reset the MODULE state, and
 * `hydrate()` is latched by `hydrated` so it never re-read. The departing
 * user's dose, sessions and personal limit therefore stayed on screen for the
 * next account, and the 15-second `persistDay()` tick then wrote that record
 * back into the new user's freshly-wiped storage, durably attributing one
 * person's hearing-exposure history to another. Registered in
 * resetAllLocalStores() alongside every other persisted store.
 */
export function resetLocal(): void {
  generation++; // a read or write still in flight for the departing listener lands nowhere
  settingsStore.reset(); // (the registry also reaches it; a second reset is harmless)
  day = null;
  session = null;
  hydrated = false; // hydrate() is latched — must clear or the re-seed no-ops
  hydrating = null;
  dayReadFailed = false;
  sounding = false;
  soundingStreak = 0;
  pendingSec = 0;
  currentDb = null;
  currentMeasured = false;
  lastMicDropped = 0;
  sessionHadGap = false;
  elevatedSec = 0;
  advisoryFiredThisSession = false;
  approachingFiredToday = false;
  reachedFiredToday = false;
  lastPersistMs = 0;
  emitState();
  void hydrate(); // re-seed a fresh day from the (now cleared) storage
}

/** A stored day, with any missing field filled (records from older builds
 *  lack 'environmental'). THROWS for a blob that is not a day at all. */
function parseDay(raw: unknown, date: string): DayRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not a day record');
  const r = raw as Partial<DayRecord>;
  const base = freshDay(date);
  return {
    ...base,
    ...r,
    date,
    routeSec: { ...base.routeSec, ...(r.routeSec && typeof r.routeSec === 'object' ? r.routeSec : {}) },
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
  };
}

/** The stored day plus the listening held while it could not be read. Time,
 *  dose and energy ADD (they are integrals over separate seconds); peaks take
 *  the larger. */
function mergeDays(stored: DayRecord, held: DayRecord): DayRecord {
  const routeSec = { ...stored.routeSec };
  for (const k of Object.keys(held.routeSec) as RouteKey[]) routeSec[k] = (routeSec[k] ?? 0) + (held.routeSec[k] ?? 0);
  return {
    date: stored.date,
    activeSec: stored.activeSec + held.activeSec,
    dose: stored.dose + held.dose,
    maxDb: Math.max(stored.maxDb, held.maxDb),
    energySum: stored.energySum + held.energySum,
    routeSec,
    checkins: stored.checkins + held.checkins,
    warnings: stored.warnings + held.warnings,
    sessions: [...stored.sessions, ...held.sessions].sort((a, b) => a.startMs - b.startMs).slice(-60),
    longestSessionSec: Math.max(stored.longestSessionSec, held.longestSessionSec),
  };
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  const gen = generation;
  hydrating = (async () => {
    await settingsStore.hydrate(); // its own failed-read rule (see settingsStore)
    if (gen !== generation) return;
    const today = dateKeyOf(new Date());
    let rawDay: string | null;
    try {
      rawDay = await AsyncStorage.getItem(DAY_KEY(today));
    } catch {
      if (gen !== generation) return;
      // READ failed — NOT "no listening today". Track this run in a held day
      // (a held day from before midnight cannot be merged into today and is
      // dropped with its date), write nothing, read again on the next flush.
      dayReadFailed = true;
      if (!day || day.date !== today) day = freshDay(today);
      hydrating = null;
      emitState();
      return;
    }
    if (gen !== generation) return;
    let stored: DayRecord | null = null;
    if (rawDay != null) {
      try {
        stored = parseDay(JSON.parse(rawDay), today);
      } catch {
        // Damaged, not unreadable: set aside, never silently discarded.
        void AsyncStorage.setItem(`${DAY_KEY(today)}:damaged`, rawDay).catch(() => {});
      }
    }
    // Listening held while the stored day could not be read is ADDED to it.
    const held = day && day.date === today ? day : null;
    day = stored && held ? mergeDays(stored, held) : stored ?? held ?? freshDay(today);
    dayReadFailed = false;
    hydrated = true;
    hydrating = null;
    emitState();
    if (held) void persistDay(true);
    void pruneOldDays(gen);
  })();
  return hydrating;
}

/** Drop days beyond retention. Best-effort; an index that cannot be read
 *  writes nothing. */
async function pruneOldDays(gen: number): Promise<void> {
  try {
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    if (gen !== generation || !rawIdx) return;
    const idx = JSON.parse(rawIdx) as string[];
    if (!Array.isArray(idx)) return;
    const keep = idx.filter((d) => d >= dateKeyOf(new Date(Date.now() - RETAIN_DAYS * 86400000)));
    const drop = idx.filter((d) => !keep.includes(d));
    if (drop.length) {
      await Promise.all(drop.map((d) => AsyncStorage.removeItem(DAY_KEY(d))));
      if (gen !== generation) return;
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(keep));
    }
  } catch {
    /* best-effort */
  }
}

async function persistDay(force = false): Promise<void> {
  if (!day || !cfg().saveHistory) return;
  const now = Date.now();
  if (!force && now - lastPersistMs < 15000) return; // batch writes
  lastPersistMs = now;
  if (!hydrated) {
    // The stored day was never read (or the read FAILED): writing now would
    // put this run's listening OVER it. Read again instead — a successful
    // read adds the held listening to the stored day and writes both.
    void hydrate();
    return;
  }
  const gen = generation;
  const d = day;
  try {
    await AsyncStorage.setItem(DAY_KEY(d.date), JSON.stringify(d));
    if (gen !== generation) return;
    // The index is read-modify-write too: a read that fails writes nothing.
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    if (gen !== generation) return;
    const parsed: unknown = rawIdx ? JSON.parse(rawIdx) : [];
    const idx = Array.isArray(parsed) ? (parsed as string[]) : [];
    if (!idx.includes(d.date)) {
      idx.push(d.date);
      idx.sort();
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    }
  } catch {
    /* persistence is best-effort; live monitoring continues */
  }
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
  sessionHadGap = false; // continuity latch is per-session
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
function readSources(): { active: boolean; db: number | null; rt: RouteKey; measured: boolean; micGap: boolean } {
  const settings = cfg();
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
  let micGap = false;
  if (isMicActive() && ApeDsp.isAvailable()) {
    const f = ApeDsp.getMeterFrame();
    /**
     * ⛔ THE SAME LIVENESS VERDICT AS EVERY OTHER READER (2026-09-22).
     *
     * This asked `f?.running`, which was a FOURTH definition of "is the mic
     * delivering audio" in a codebase that already exports one. `running`
     * stays true through a stalled capture — `captureStalled` is the other
     * half — so `f.aFastDb` here could be the last level the engine managed to
     * produce, held indefinitely, and this integral went on accumulating
     * hearing dose from it.
     *
     * That matters more here than on any display. This is the noise-exposure
     * figure the app uses to warn someone about their hearing, and a frozen
     * quiet reading under-reports a loud room — the one direction that costs
     * something real. When the capture is not live we do not have an
     * environmental measurement, so we say so (inDb stays null) rather than
     * integrating a number we cannot stand behind.
     */
    if (frameIsLive(f)) {
      // Continuity: a NEW dropout since the last read means the mic stream
      // overran/stalled — track the monotonic counter (it resets to 0 on a fresh
      // capture, which is not a gap).
      if (f.droppedFrames > lastMicDropped) micGap = true;
      lastMicDropped = f.droppedFrames;
      if (Number.isFinite(f.aFastDb)) {
        const cal = getSplCalibration();
        const spl = Math.round((f.aFastDb + (cal?.offsetDb ?? INPUT_NOMINAL_OFFSET)) * 10) / 10;
        inDb = Math.max(0, spl);
        inMeasured = cal != null;
      }
    }
  }

  if (outDb == null && inDb == null) return { active: false, db: null, rt: 'unknown', measured: false, micGap };
  if (inDb != null && (outDb == null || inDb >= outDb)) return { active: true, db: inDb, rt: 'environmental', measured: inMeasured, micGap };
  return { active: true, db: outDb, rt: outRoute, measured: false, micGap };
}

/** One 1 s tick of the monitor. */
function tick(): void {
  const settings = cfg();
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
    // Retro-credited to the DAY too (hunt 8, 2026-10-03): the held second went
    // into the session only, so every session's first second of listening —
    // its time AND its dose — was missing from today's record (Current
    // session 0:02 over Today 1 s).
    let dt = 1; // seconds
    if (!session) {
      if (soundingStreak < 2) {
        pendingSec = 1;
        emitState();
        return;
      }
      session = { startMs: now - pendingSec * 1000, activeSec: 0, maxDb: 0, lastActiveMs: now };
      dt += pendingSec;
      pendingSec = 0; // credited once
      sessionHadGap = false; // fresh session — clear the continuity latch
    }

    // A dropout while the mic is the measured source means this session's dose
    // integral spanned a gap (Phase 1 A1) — latch it for honest disclosure.
    if (src.micGap && route === 'environmental') sessionHadGap = true;

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
    // of the interval (active time, not clock time — §4). A CROSSING, since a
    // session's opening tick adds its retro-credited second as well.
    if (settings.checkinMinutes > 0) {
      const intSec = settings.checkinMinutes * 60;
      if (Math.floor(d.activeSec / intSec) > Math.floor((d.activeSec - dt) / intSec)) {
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
    //
    // ── THE ONCE-A-DAY LATCH MUST NOT BE SPENT ON A WARNING NOBODY SAW ──────
    //
    // These set their flag BEFORE emitting, and `ExposureCheckin` drops the
    // event outright while overlays are suppressed. So in Low-Light Production
    // Mode the daily hearing-dose warning was consumed without ever being
    // shown, and could not fire again that day — in the mode used during live
    // shows, which is exactly when a full dose is most likely and matters most.
    //
    // Low-Light's rule stands: nothing auto-appears. But "do not interrupt right
    // now" is not "never mention it". Holding the latch means the warning is
    // still waiting, and fires on the next tick after the mode is turned off.
    // This is also the one place in the app that gated at EMIT time rather than
    // at render time, which is why it burned rather than waited.
    if (settings.criticalWarnings && !areOverlaysSuppressed()) {
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
  if (cfg().enabled && appActive && (isAudioOutputEnabled() || isMicActive())) startTimer();
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
    // ⛔ 'inactive' IS NOT BACKGROUNDED — and here that distinction is a
    //    measurement one, not a lifecycle nicety. iOS reports 'inactive' for a
    //    permission alert, an incoming-call banner, an app-switcher peek or a
    //    Control-Centre pull. Treating those as backgrounded stopped the 1 Hz
    //    dose poller and cleared `sounding` while the room was still loud, so
    //    the day's dose UNDER-reported — the wrong direction for a hearing
    //    safety number. Only a real 'background' stands the monitor down;
    //    anything else leaves it exactly as it was.
    if (st === 'background') appActive = false;
    else if (st === 'active') appActive = true;
    else return; // 'inactive' / 'unknown' / 'extension' — no change, no persist
    if (!appActive && day) void persistDay(true);
    evaluateArm();
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getExposureSnapshot(): ExposureSnapshot {
  const settings = cfg();
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
    hadGap: sessionHadGap,
    doseUnreadable: dayReadFailed,
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

/** Applied on top of the stored settings (held until they have been read).
 *  Resolves true only when the device accepted the write. */
export function updateExposureSettings(patch: Partial<ExposureSettings>): Promise<boolean> {
  // The Exposure screen says a refusal ("Setting not saved").
  const written = settingsStore.mutate((s) => ({ ...s, ...patch }), { reportFailure: false });
  evaluateArm();
  emitState();
  return written;
}

/**
 * Every stored day plus today. With `strict` it REJECTS when the stored days
 * could not be read (toddler evening 2026-10-02, pass 3): the export used to
 * share whatever this read fell back to — today alone — as "your exposure
 * history", over the days still on the device. One damaged day is skipped on
 * its own; it no longer collapses the whole history to today.
 */
export async function getExposureHistory(strict = false): Promise<DayRecord[]> {
  try {
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    const parsedIdx: unknown = rawIdx ? JSON.parse(rawIdx) : [];
    const idx = Array.isArray(parsedIdx) ? (parsedIdx as string[]) : [];
    const today = dateKeyOf(new Date());
    const keys = idx.filter((d) => d !== today);
    const rows = await Promise.all(keys.map((k) => AsyncStorage.getItem(DAY_KEY(k))));
    const out: DayRecord[] = [];
    rows.forEach((r, i) => {
      if (r == null) return;
      try {
        out.push(parseDay(JSON.parse(r), keys[i]));
      } catch {
        // damaged day — the others still show
      }
    });
    if (day) out.push(day);
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (e) {
    if (strict) throw e;
    return day ? [day] : [];
  }
}

/**
 * The history LIST for the Exposure screen (hunt 7, 2026-10-03; D51 "a failed
 * read is told, never shown as empty"). The screen used the non-strict read,
 * whose failure fallback is today alone — so a history that could not be read
 * showed as "No history yet." (or as today only) over every day still stored.
 * `unreadable` lets the screen say so; `days` is today's in-memory record then,
 * so today's sessions and source breakdown still show.
 */
export async function readExposureHistory(): Promise<{ days: DayRecord[]; unreadable: boolean }> {
  try {
    return { days: await getExposureHistory(true), unreadable: false };
  } catch {
    return { days: day ? [day] : [], unreadable: true };
  }
}

/**
 * Resolves FALSE when the stored day could not be removed (toddler evening
 * 2026-10-02, pass 2). The failure was swallowed: today read 0 on screen
 * while the stored day stayed on disk and came back at the next launch. Now
 * the cleared day is put back (with any listening since added to it) and the
 * caller says so.
 */
export async function deleteExposureToday(): Promise<boolean> {
  const today = dateKeyOf(new Date());
  const prev = day && day.date === today ? day : null;
  const prevApproaching = approachingFiredToday;
  const prevReached = reachedFiredToday;
  day = freshDay(today);
  const cleared = day;
  session = null;
  approachingFiredToday = false;
  reachedFiredToday = false;
  const gen = generation;
  const removed = await AsyncStorage.removeItem(DAY_KEY(today)).then(
    () => true,
    () => false,
  );
  // The user deleted today on purpose: once the stored copy is really gone,
  // there is nothing left to read, so an unreadable day is settled.
  if (removed && gen === generation && dayReadFailed && !hydrating) {
    dayReadFailed = false;
    hydrated = true;
  }
  if (!removed && gen === generation && prev && day === cleared) {
    day = mergeDays(prev, cleared);
    approachingFiredToday = approachingFiredToday || prevApproaching;
    reachedFiredToday = reachedFiredToday || prevReached;
  }
  emitState();
  return removed;
}

/**
 * Resolves FALSE when the stored days could not all be removed (toddler
 * evening 2026-10-02). The failure used to be swallowed as "best-effort" and
 * the screen emptied its history list anyway: someone who deleted their
 * listening record was shown it gone while every stored day was still on the
 * device, back on screen at the next visit.
 */
export async function deleteExposureHistory(): Promise<boolean> {
  let ok = true;
  try {
    const rawIdx = await AsyncStorage.getItem(INDEX_KEY);
    const idx = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
    await Promise.all(idx.map((d) => AsyncStorage.removeItem(DAY_KEY(d))));
    await AsyncStorage.removeItem(INDEX_KEY);
  } catch {
    ok = false;
  }
  if (!(await deleteExposureToday())) ok = false;
  return ok;
}

/** Serialized history for the user's own export (privacy §22). */
export async function exportExposureHistory(): Promise<string> {
  // REJECTS when the stored days could not be read — the screen then says the
  // export did not complete, rather than sharing today as the whole history.
  const rows = await getExposureHistory(true);
  return JSON.stringify(
    { exported: new Date().toISOString(), standard: cfg().standard, note: 'Educational exposure estimates — not medical or compliance measurements.', days: rows },
    null,
    2,
  );
}

// ── Formatting helpers (shared by the panel, strip and screen) ───────────────

/** Live clock form (m:ss / h:mm:ss) — the ticking readout while tracking is
 *  active, so the user can SEE the seconds move (owner 2026-09-05). */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    : `${m}:${String(r).padStart(2, '0')}`;
}

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
