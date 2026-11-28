/**
 * fxClickTempo — the CLICK source's tempo in the effect labs (owner
 * 2026-11-25, must-do D85: "Add a way to change BPM in the lab screens that
 * show the waveform going by (Gate, etc.)"; and, the same day: "changing tempo
 * should slow the pace at which the audio is seen... what you hear should
 * match what you see"; confirmed, his words: "the whole point is to slow the
 * picture down so the user can see it slower. the tempo of the sound should
 * match. the sound can be the same sample, just the midi note on event of it
 * changes tempo. the visual should slow down by the same amount of speed even
 * though the length of each sample (not being changed) will be the same no
 * matter what tempo.. but the user can see it going by slower"). So the click
 * itself and each hit's own duration in ms never change; only how often it
 * fires does, and the picture's travel speed scales by live ÷ opening BPM.
 *
 * ONE source of truth: the tempo the student sets lives in FxLabScreen as the
 * selected CLICK source's own `gen.clickBpm`. The generator gets it through
 * genSet (the sound), and every drawing gets it through the same source spec
 * (the hits, the GR strip, the echoes, the reverb sweep).
 *
 * THE PICTURE KEEPS STEP: a moving display's time window is a fixed number of
 * BEATS, not of milliseconds — window = base × (opening BPM ÷ live BPM). At
 * the lab's own tempo the picture is exactly the old one; at half the tempo
 * the hits cross the glass at half the speed and the glass holds as many hits
 * as before. Shapes stay at their true durations on that axis, and the
 * rulers say the real time the window spans.
 *
 * Pure: no React Native, no native module, so the tests run it directly.
 */

/** The generator's own range is 20–300 BPM (Generator.hpp setClickBpm); the
 *  lanes stay inside 30–240. */
export const CLICK_TEMPO_MIN = 30;
export const CLICK_TEMPO_MAX = 240;
/** The generator's own tempo when a click source names none (Generator.hpp
 *  `clickBpm_{120.0}`). Every effect-lab CLICK names one. */
export const CLICK_TEMPO_DEFAULT = 120;
/** How far the window may grow or shrink from its opening span: 2 = between
 *  half and twice. That bounds each lab's tempo to half … twice its opening
 *  tempo, so the window is never clamped (the picture always keeps step) and
 *  the shapes stay readable: at twice the span the delay's 80 ms slapback
 *  still sits about 2.5 px from its click and a 30 ms release is about 3 px
 *  wide (390-wide phone); at half the span the 5 ms click is about 2 px. */
export const CLICK_WINDOW_SCALE_MAX = 2;

export type ClickTempoRange = { min: number; max: number };
const FULL_RANGE: ClickTempoRange = { min: CLICK_TEMPO_MIN, max: CLICK_TEMPO_MAX };

/** A whole BPM inside `range` (default 30–240). Not a number → the default. */
export function clampClickBpm(bpm: number | undefined, range: ClickTempoRange = FULL_RANGE): number {
  const b = bpm == null || !Number.isFinite(bpm) ? CLICK_TEMPO_DEFAULT : Math.round(bpm);
  return Math.max(range.min, Math.min(range.max, b));
}

/** A lab's tempo range: half to twice its opening tempo, inside 30–240, and
 *  no higher than `capMax` where the lab's drawing can follow the sound only
 *  that far (the Gate: fxLabConfigs gateConfig.clickTempoMax). */
export function clickTempoRange(presetBpm: number, capMax?: number): ClickTempoRange {
  const p = clampClickBpm(presetBpm);
  const min = Math.max(CLICK_TEMPO_MIN, Math.ceil(p / CLICK_WINDOW_SCALE_MAX));
  const max = Math.min(CLICK_TEMPO_MAX, Math.floor(p * CLICK_WINDOW_SCALE_MAX), capMax ?? CLICK_TEMPO_MAX);
  return { min, max: Math.max(min, max) };
}

/** Milliseconds from one hit to the next: 60,000 ÷ BPM. */
export function clickPeriodMs(bpm: number | undefined): number {
  return 60000 / clampClickBpm(bpm);
}

/** One − / + tap on the lane = one BPM (rack `DockParam.steps`). */
export function clickTempoSteps(range: ClickTempoRange = FULL_RANGE): number {
  return Math.max(1, range.max - range.min);
}

/** The lane position (0..1, linear) of a tempo. */
export function clickTempoPos(bpm: number, range: ClickTempoRange = FULL_RANGE): number {
  return (clampClickBpm(bpm, range) - range.min) / clickTempoSteps(range);
}

/** The whole tempo at a lane position. */
export function clickTempoFromPos(pos: number, range: ClickTempoRange = FULL_RANGE): number {
  const p = Number.isFinite(pos) ? Math.max(0, Math.min(1, pos)) : 0;
  return clampClickBpm(range.min + p * clickTempoSteps(range), range);
}

/** The source's name at a tempo, as the SOURCE tray lists it: "CLICK 45"
 *  (the same form fxLabConfigs' srcClick builds). */
export function clickTempoLabel(bpm: number): string {
  return `CLICK ${clampClickBpm(bpm)}`;
}

/** The SOURCE key's value while a CLICK is chosen: "TEMPO 45". The key names
 *  what its fader sets, so the tempo reads as settable without opening
 *  anything (checker 2026-11-25, discoverability). */
export function clickTempoShort(bpm: number): string {
  return `TEMPO ${clampClickBpm(bpm)}`;
}

/** The lane's readout (and what a screen reader hears): "CLICK TEMPO 45 BPM". */
export function clickTempoReadout(bpm: number): string {
  return `CLICK TEMPO ${clampClickBpm(bpm)} BPM`;
}

/** What the CLICK's tray blurb adds: how to set the tempo, the lab's range,
 *  that the picture keeps step, and (Gate) why the range stops early. */
export function clickTempoBlurb(range: ClickTempoRange, why?: string): string {
  return (
    `Close this tray with ✕ and drag the fader to set its tempo, ${range.min} to ${range.max} BPM. ` +
    'Slowing the tempo also slows how fast the picture moves, so the picture keeps step with what you hear.' +
    (why ? ` ${why}` : '')
  );
}

/** The shape of an effect-lab source this module needs. */
type ClickSourceLike = { label: string; short?: string; gen: { clickBpm?: number }; clickOpenBpm?: number };

/**
 * The source as it plays NOW. `presetBpm` is the lab's own tempo for this
 * CLICK (undefined = not a CLICK source: returned untouched); `bpm` is the
 * student's (undefined = never moved). At the preset the SAME object comes
 * back, so the lab opens exactly as before; any other tempo gets its own
 * label, key value and generator tempo, and carries the opening tempo
 * (`clickOpenBpm`) so the drawings scale their window by it.
 */
export function liveClickSource<T extends ClickSourceLike>(src: T, presetBpm: number | undefined, bpm: number | undefined): T {
  if (presetBpm == null || bpm == null) return src;
  const b = clampClickBpm(bpm);
  const open = clampClickBpm(presetBpm);
  if (b === open && src.gen.clickBpm === b) return src;
  return { ...src, label: clickTempoLabel(b), short: `${b} BPM`, gen: { ...src.gen, clickBpm: b }, clickOpenBpm: open };
}

/** How much longer the moving window is than at the opening tempo:
 *  opening BPM ÷ live BPM (1 when the tempo never moved). */
export function clickWindowScale(openBpm: number | undefined, liveBpm: number | undefined): number {
  if (openBpm == null || liveBpm == null) return 1;
  return clampClickBpm(openBpm) / clampClickBpm(liveBpm);
}

/** The window's real span: base × opening ÷ live. */
export function clickWindowMs(baseMs: number, openBpm: number | undefined, liveBpm: number | undefined): number {
  return baseMs * clickWindowScale(openBpm, liveBpm);
}

/** A span in plain words: "900 ms", "1.8 s". */
export function fmtSpan(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${+(ms / 1000).toFixed(2)} s`;
}

/** The dynamics strip's span note, shown once the tempo moved the window off
 *  its opening 900 ms (the strip has no ruler): "OUT = 1.8 s". */
export function outSpanLabel(ms: number): string {
  return `OUT = ${fmtSpan(ms)}`;
}

/** A ruler label: "0.25 s", "0.5 s", "1 s", "2 s". */
export function fmtSeconds(ms: number): string {
  return `${+(ms / 1000).toFixed(2)} s`;
}

/** The ruler's step for a scaled window: the opening step × ½, 1 or 2,
 *  whichever is nearest the window's scale, so the labels sit about as far
 *  apart as at the opening tempo (within ±41 %) and the opening ruler is
 *  unchanged. */
export function rulerStepMs(baseStepMs: number, windowScale: number): number {
  const s = Number.isFinite(windowScale) && windowScale > 0 ? windowScale : 1;
  let best = 1;
  for (const k of [0.5, 2]) if (Math.abs(Math.log(k / s)) < Math.abs(Math.log(best / s)) - 1e-12) best = k;
  return baseStepMs * best;
}

/**
 * Where the click train's hits sit after a tempo change, for a drawing whose
 * hits are at origin + k·P on a clock that has been running for minutes:
 * [P, origin] → [newP, the newest hit at or before `nowMs`]. That hit keeps
 * its place and the train re-spaces around it, so dragging the tempo
 * stretches the hits instead of throwing them about (k·ΔP is many periods
 * once k is in the hundreds). The history already on the glass is redrawn at
 * the new tempo: the drawing keeps no memory of the old one.
 */
export function rebaseHitGrid(grid: readonly number[], newPeriodMs: number, nowMs: number): number[] {
  const P = grid[0];
  const origin = grid[1];
  if (!(P > 0) || !Number.isFinite(nowMs) || !Number.isFinite(origin)) return [newPeriodMs, 0];
  return [newPeriodMs, origin + Math.floor((nowMs - origin) / P) * P];
}

/* ── THE CLICK ANCHOR: what you see is what you hear (third pass, 2026-11-25) ─
 * ONE anchor, owned by FxLabScreen, in WALL-CLOCK time (performance.now(),
 * the same steady clock the worklets read: react-native-worklets
 * WorkletRuntimeDecorator performanceNow is "copied from JSExecutor.cpp"):
 * the heard clicks sit at t0 + k·P. Every drawing maps it straight onto the
 * wall clock each frame, so a remount (FULL SCREEN, a zoom step, HIDE /
 * OPEN DISPLAY), a lost focus or a stalled frame never moves a drawn hit off
 * the sound — nothing is counted from the drawing's own frame time. */
export type ClickAnchor = { t0: number; periodMs: number };

/** A retrigger while the generator is AUDIBLE dips its 10 ms envelope first
 *  and restarts the click at the bottom (Generator.hpp renderInto
 *  `trigPending_`, fadeSamples = 10 ms): choosing the CLICK while another
 *  source plays starts the click this much later. */
export const GEN_RETRIGGER_DIP_MS = 10;

/** The anchor when the click (re)starts: the generator zeroes its click timer
 *  and plays a click at once (Generator.hpp applyTrigger), `delayMs` later
 *  (0 from silence, GEN_RETRIGGER_DIP_MS while audible). */
export function anchorAtStart(periodMs: number, nowMs: number, delayMs = 0): ClickAnchor {
  return { t0: nowMs + delayMs, periodMs };
}

/** The anchor after a tempo write at `writeMs` (recorded with the genSet call,
 *  never later). The generator's click timer keeps the time since the last
 *  click and only the interval changes (Generator.hpp:525-527:
 *  `clickTimer_ += 1/fs; if (clickTimer_ >= interval) clickTimer_ -= interval;`),
 *  so the elapsed e = (write − t0) mod P carries over, reduced mod the new
 *  interval when the tempo rises past it: the new train sits at
 *  write − (e mod P′) + k·P′. */
export function anchorAfterTempoWrite(a: ClickAnchor, newPeriodMs: number, writeMs: number): ClickAnchor {
  if (!(a.periodMs > 0) || !(newPeriodMs > 0) || !Number.isFinite(writeMs) || !Number.isFinite(a.t0)) return { t0: writeMs, periodMs: newPeriodMs };
  const mod = (x: number, m: number) => ((x % m) + m) % m;
  const e = mod(writeMs - a.t0, a.periodMs);
  return { t0: writeMs - mod(e, newPeriodMs), periodMs: newPeriodMs };
}

/** The newest heard click at or before `wallMs`. */
export function lastHitMs(a: ClickAnchor, wallMs: number): number {
  return a.t0 + Math.floor((wallMs - a.t0) / a.periodMs) * a.periodMs;
}

/** The next heard click after `wallMs`. */
export function nextHitMs(a: ClickAnchor, wallMs: number): number {
  return lastHitMs(a, wallMs) + a.periodMs;
}

/* ── THE OUTPUT DELAY: draw the click when it is HEARD (must-do D85 (a), 1.0.1
 * store build, engine 12) ─────────────────────────────────────────────────
 * The anchor above is the time the generator PLAYS each click (it is set and
 * moved from the genStart / genSet calls). The student hears it later by the
 * phone's audio output delay: a few ms to tens of ms on the speaker or wired
 * headphones, about 100–300 ms on Bluetooth. FxLabScreen keeps the anchor in
 * play time (every tempo write still maps through anchorAfterTempoWrite) and
 * hands the drawings heardClickAnchor(anchor, latency): the same train, later
 * by the measured delay, so a drawn hit reaches the stage as its click is heard.
 * The delay comes from ApeDsp.outputLatencyMs() (null on a build older than
 * engine 12, and whenever it is not known now), read at ▶, at a source pick or
 * tempo write while playing, and every OUTPUT_LATENCY_POLL_MS while playing,
 * so plugging in headphones or pairing Bluetooth mid-lesson moves the picture
 * to the new delay within half a second. With no reading ever (an older build)
 * the delay stays 0 and the drawings get the very same anchor object as before. */

/** The most delay the picture will follow: past any real phone route (a
 *  Bluetooth codec is about 100–300 ms), so a wild reading cannot throw the
 *  picture half a beat off. */
export const OUTPUT_LATENCY_MAX_MS = 500;
/** A new reading moves the picture only when it differs from the one in use by
 *  this much: below half a 60 Hz frame (8.3 ms) no one can see the difference,
 *  and Android's reading wobbles by about a burst as frames are written. */
export const OUTPUT_LATENCY_STEP_MS = 8;
/** How often a playing lab re-reads the delay (a route change mid-session). */
export const OUTPUT_LATENCY_POLL_MS = 500;

/** A reading as a usable delay: 0 when null / not a number / not positive;
 *  never more than OUTPUT_LATENCY_MAX_MS. */
export function clampOutputLatencyMs(ms: number | null | undefined): number {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(OUTPUT_LATENCY_MAX_MS, ms);
}

/** The delay in use after a reading: a reading that is not known (null, not
 *  a number, negative) keeps the one in use; a reading within
 *  OUTPUT_LATENCY_STEP_MS of it keeps it too (no jitter); else the clamped
 *  reading. Starts at 0, so a build that never reads stays at 0. */
export function nextOutputLatencyMs(prevMs: number, readMs: number | null | undefined): number {
  if (readMs == null || !Number.isFinite(readMs) || readMs < 0) return prevMs;
  const next = clampOutputLatencyMs(readMs);
  return Math.abs(next - prevMs) < OUTPUT_LATENCY_STEP_MS ? prevMs : next;
}

/** The train as HEARD: the play-time anchor, later by the output delay. A
 *  delay of 0 (or none) returns the SAME anchor object, so the drawings are
 *  exactly as before. */
export function heardClickAnchor(a: ClickAnchor, latencyMs: number | null | undefined): ClickAnchor {
  const l = clampOutputLatencyMs(latencyMs);
  return l === 0 ? a : { t0: a.t0 + l, periodMs: a.periodMs };
}
