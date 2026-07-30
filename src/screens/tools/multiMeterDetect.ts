/**
 * multiMeterDetect — Smart Detection heuristics for the Pro Audio MultiMeter
 * (owner spec 2026-07-29). PURE, unit-testable functions:
 *
 *   analyze(input, state)       — reads ONE set of REAL engine frames and
 *                                 returns raw detections + the next tracker
 *                                 state (no side effects; state in → state out)
 *   applyHysteresis(prev, ...)  — turns raw detections into stable chips:
 *                                 a chip appears only after ~0.7 s of
 *                                 persistence and clears only after ~1.5 s of
 *                                 absence, so the panel never flickers.
 *
 * HONESTY (measurement-tools §1.7): every detection is a LIKELY CONDITION
 * inferred from the measured signal — never a diagnosis, never a guarantee
 * (the screen prints the owner's framing verbatim). Nothing here fabricates:
 * an absent frame simply yields no detections, and every threshold below is a
 * disclosed heuristic constant, exported for tests.
 *
 * Heuristics implemented (owner spec §7):
 *  - mains hum        — narrow spikes at 50/60 Hz + harmonics vs their
 *                       spectral neighborhood; reports WHICH family
 *  - 120 Hz harmonic  — the rectified-supply signature (120 Hz spike that
 *                       dominates any 60 Hz fundamental)
 *  - pink-noise-like  — broadband spectral slope ≈ −3 dB/oct over
 *                       100 Hz–10 kHz (least-squares fit + R² gate)
 *  - clipping         — meter clip-run delta or clipped waveform buckets
 *  - mic overload     — sustained peaks ≥ −1 dBFS
 *  - feedback onset   — ONE narrowband component rising monotonically over
 *                       ~1.5 s (per-peak history tracker); reports the Hz
 *  - LF rumble        — energy below 60 Hz dominating the rest of the band
 *  - narrowband whistle — stable single tone, high pitch confidence, few
 *                       harmonics visible in the spectrum
 */

export type DetectionId =
  | 'hum_50'
  | 'hum_60'
  | 'hum_120'
  | 'pink_noise'
  | 'clipping'
  | 'mic_overload'
  | 'feedback'
  | 'lf_rumble'
  | 'whistle';

export type DetectionSeverity = 'amber' | 'red';

export type Detection = {
  id: DetectionId;
  label: string;
  detail: string;
  severity: DetectionSeverity;
};

/** One analysis tick's inputs — REAL frames only (null = not available). */
export type DetectInput = {
  tMs: number;
  /** Fine FFT spectrum, dBFS per bin (bin 0 = DC), or null when unavailable. */
  spectrumDb: Float32Array | null;
  sampleRate: number;
  fftSize: number;
  meter: { peakDb: number; clipRuns: number } | null;
  /** True when any waveform bucket in the recent window is flagged clipped. */
  waveClipped: boolean;
  pitch: { freq: number; confidence: number; voiced: boolean; levelDb: number } | null;
};

/** Tracker state carried between analysis ticks (caller owns it). */
export type DetectState = {
  /** Rolling narrowband-peak history for the feedback tracker. */
  peakHist: { tMs: number; hz: number; db: number }[];
  /** clipRuns at the previous analysis — clip detection fires on the DELTA. */
  lastClipRuns: number;
  /** When the sustained ≥ −1 dBFS peak streak began (0 = no streak). */
  overloadSinceMs: number;
};

export const initialDetectState = (): DetectState => ({
  peakHist: [],
  lastClipRuns: 0,
  overloadSinceMs: 0,
});

/** Disclosed heuristic thresholds — exported so unit tests pin them. */
export const DETECT = {
  humSpikeDb: 12, // narrow peak must clear its neighborhood median by this
  humMinDb: -80, // and sit above this absolute floor to count at all
  humRedDb: -30, // hum peak at/above this escalates amber → red
  humMinHarmonics: 2, // spiking members required to call a family
  pinkSlopeMin: -4.5, // dB/oct band accepted as "pink-like" (−3 nominal)
  pinkSlopeMax: -1.5,
  pinkR2Min: 0.85,
  pinkFloorDb: -95, // a fit point below this is "no energy" — not broadband
  pinkBroadbandFrac: 0.9, // fraction of fit points that must carry energy
  overloadPeakDb: -1,
  overloadHoldMs: 1000,
  fbWindowMs: 1500, // rise must persist about this long
  fbMinRiseDb: 5, // net rise over the window
  fbStepTolDb: 0.5, // per-step jitter allowed while still "monotonic"
  fbNarrowAboveMedianDb: 15, // peak must stand this far above the spectrum median
  fbMinLevelDb: -50, // and the latest reading must be at least this hot
  fbHzTolFrac: 0.03, // peak must stay within ±3% in frequency
  rumbleSplitHz: 60,
  rumbleMinPeakDb: -50, // the LF region must actually be hot, not just "loudest"
  whistleConfMin: 0.85,
  whistleMinHz: 1000,
  whistleMinLevelDb: -55,
  whistleHarmonicDropDb: 20, // 2f/3f must sit at least this far below the tone
  appearMs: 700, // hysteresis: chip appears after this much persistence
  clearMs: 1500, // …and clears after this much absence
} as const;

// ---------------------------------------------------------------------------
// Spectrum helpers (all read REAL bins; none interpolate or invent values)
// ---------------------------------------------------------------------------

/** Max bin within ±tolFrac of hz (min ±2 bins). Null when out of range. */
function narrowPeak(
  spec: Float32Array,
  hzPerBin: number,
  hz: number,
  tolFrac: number,
): { db: number; hz: number } | null {
  const tolBins = Math.max(2, Math.round((hz * tolFrac) / hzPerBin));
  const c = Math.round(hz / hzPerBin);
  const lo = Math.max(1, c - tolBins);
  const hi = Math.min(spec.length - 1, c + tolBins);
  if (lo > hi) return null;
  let best = -Infinity;
  let bestI = lo;
  for (let i = lo; i <= hi; i++) {
    if (spec[i] > best) {
      best = spec[i];
      bestI = i;
    }
  }
  return Number.isFinite(best) ? { db: best, hz: bestI * hzPerBin } : null;
}

/** Median of the bins around hz (±10%, min ±6 bins) EXCLUDING the narrow core
 *  (±3%, min ±2 bins) — the "what the neighborhood looks like" reference a hum
 *  spike must clear. */
function neighborhoodMedianDb(spec: Float32Array, hzPerBin: number, hz: number): number {
  const c = Math.round(hz / hzPerBin);
  const outer = Math.max(6, Math.round((hz * 0.1) / hzPerBin));
  const inner = Math.max(2, Math.round((hz * 0.03) / hzPerBin));
  const vals: number[] = [];
  for (let d = inner + 1; d <= outer; d++) {
    const a = c - d;
    const b = c + d;
    if (a >= 1) vals.push(spec[a]);
    if (b <= spec.length - 1) vals.push(spec[b]);
  }
  if (vals.length === 0) return -Infinity;
  vals.sort((x, y) => x - y);
  return vals[Math.floor(vals.length / 2)];
}

/** Coarse spectrum median (every 8th bin above fMin) — narrowband reference. */
function coarseMedianDb(spec: Float32Array, hzPerBin: number, fMin: number): number {
  const start = Math.max(1, Math.ceil(fMin / hzPerBin));
  const vals: number[] = [];
  for (let i = start; i < spec.length; i += 8) vals.push(spec[i]);
  if (vals.length === 0) return -Infinity;
  vals.sort((x, y) => x - y);
  return vals[Math.floor(vals.length / 2)];
}

type HumFamily = { count: number; maxDb: number; spikes: number[] };

/** How many harmonics of `base` (k = 1..5, below Nyquist) spike above their
 *  spectral neighborhood. */
function humFamily(spec: Float32Array, hzPerBin: number, nyquist: number, base: number): HumFamily {
  let count = 0;
  let maxDb = -Infinity;
  const spikes: number[] = [];
  for (let k = 1; k <= 5; k++) {
    const f = base * k;
    if (f > nyquist * 0.9) break;
    const peak = narrowPeak(spec, hzPerBin, f, 0.02);
    if (!peak || peak.db <= DETECT.humMinDb) continue;
    const med = neighborhoodMedianDb(spec, hzPerBin, f);
    if (Number.isFinite(med) && peak.db - med >= DETECT.humSpikeDb) {
      count++;
      spikes.push(f);
      if (peak.db > maxDb) maxDb = peak.db;
    }
  }
  return { count, maxDb, spikes };
}

/** Is the single harmonic at `hz` spiking? Returns its level or null. */
function harmonicSpikeDb(spec: Float32Array, hzPerBin: number, hz: number): number | null {
  const peak = narrowPeak(spec, hzPerBin, hz, 0.02);
  if (!peak || peak.db <= DETECT.humMinDb) return null;
  const med = neighborhoodMedianDb(spec, hzPerBin, hz);
  return Number.isFinite(med) && peak.db - med >= DETECT.humSpikeDb ? peak.db : null;
}

const fmtHz = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`);

// ---------------------------------------------------------------------------
// analyze — one tick of raw detections (pure: state in → state out)
// ---------------------------------------------------------------------------

export function analyze(input: DetectInput, state: DetectState): { raw: Detection[]; state: DetectState } {
  const raw: Detection[] = [];
  const next: DetectState = {
    peakHist: state.peakHist,
    lastClipRuns: state.lastClipRuns,
    overloadSinceMs: state.overloadSinceMs,
  };
  const { spectrumDb: spec, sampleRate, fftSize, meter, pitch, tMs } = input;
  const hzPerBin = sampleRate > 0 && fftSize > 0 ? sampleRate / fftSize : 0;
  const nyquist = sampleRate / 2;

  // ---- Clipping (meter clip-run delta OR clipped waveform buckets) — red.
  if (meter) {
    const delta = Math.max(0, meter.clipRuns - state.lastClipRuns);
    next.lastClipRuns = meter.clipRuns;
    if (delta > 0 || input.waveClipped) {
      raw.push({
        id: 'clipping',
        label: 'CLIPPING',
        detail: 'input hit digital full scale — clipped samples in the last moments',
        severity: 'red',
      });
    }
  }

  // ---- Possible mic overload (sustained ≥ −1 dBFS peaks) — red.
  if (meter && meter.peakDb >= DETECT.overloadPeakDb) {
    const since = state.overloadSinceMs > 0 ? state.overloadSinceMs : tMs;
    next.overloadSinceMs = since;
    if (tMs - since >= DETECT.overloadHoldMs) {
      raw.push({
        id: 'mic_overload',
        label: 'POSSIBLE MIC OVERLOAD',
        detail: `peaks sustained at ≥ ${DETECT.overloadPeakDb} dBFS — the capsule/converter may be overdriven`,
        severity: 'red',
      });
    }
  } else {
    next.overloadSinceMs = 0;
  }

  if (spec && spec.length > 8 && hzPerBin > 0) {
    // ---- Mains hum families (50 Hz vs 60 Hz) + the 120 Hz rectified signature.
    const fam50 = humFamily(spec, hzPerBin, nyquist, 50);
    const fam60 = humFamily(spec, hzPerBin, nyquist, 60);
    const qualifies = (f: HumFamily) => f.count >= DETECT.humMinHarmonics;
    if (qualifies(fam50) || qualifies(fam60)) {
      // Both qualifying is ambiguous (shared harmonics like 300 Hz) — report
      // the stronger family only, never both.
      const pick50 =
        qualifies(fam50) && (!qualifies(fam60) || fam50.count > fam60.count || (fam50.count === fam60.count && fam50.maxDb >= fam60.maxDb));
      const fam = pick50 ? fam50 : fam60;
      raw.push({
        id: pick50 ? 'hum_50' : 'hum_60',
        label: `MAINS HUM (${pick50 ? '50' : '60'} Hz)`,
        detail: `narrow spikes at ${fam.spikes.map((f) => Math.round(f)).join(' · ')} Hz`,
        severity: fam.maxDb >= DETECT.humRedDb ? 'red' : 'amber',
      });
    }
    const s120 = harmonicSpikeDb(spec, hzPerBin, 120);
    const s60 = harmonicSpikeDb(spec, hzPerBin, 60);
    if (s120 != null && (s60 == null || s120 >= s60 + 6)) {
      raw.push({
        id: 'hum_120',
        label: '120 Hz HARMONIC',
        detail: '120 Hz spike dominating any 60 Hz fundamental — a rectified power-supply signature',
        severity: s120 >= DETECT.humRedDb ? 'red' : 'amber',
      });
    }

    // ---- Broadband pink-noise character: slope ≈ −3 dB/oct over 100 Hz–10 kHz.
    // Fit points = 1/3-octave energy averages (equal per-octave weighting).
    {
      const xs: number[] = [];
      const ys: number[] = [];
      let points = 0;
      let live = 0;
      for (let k = 0; ; k++) {
        const c = 100 * Math.pow(2, k / 3);
        if (c > 10000 * 1.001 || c > nyquist * 0.9) break;
        const lo = Math.max(1, Math.ceil((c / Math.pow(2, 1 / 6)) / hzPerBin));
        const hi = Math.min(spec.length - 1, Math.floor((c * Math.pow(2, 1 / 6)) / hzPerBin));
        if (lo > hi) continue;
        let power = 0;
        for (let i = lo; i <= hi; i++) power += Math.pow(10, spec[i] / 10);
        const db = 10 * Math.log10(power / (hi - lo + 1));
        points++;
        if (db > DETECT.pinkFloorDb) {
          live++;
          xs.push(Math.log2(c / 100)); // octaves above 100 Hz
          ys.push(db);
        }
      }
      if (points >= 12 && live >= points * DETECT.pinkBroadbandFrac && xs.length >= 8) {
        const n = xs.length;
        let sx = 0;
        let sy = 0;
        let sxx = 0;
        let sxy = 0;
        let syy = 0;
        for (let i = 0; i < n; i++) {
          sx += xs[i];
          sy += ys[i];
          sxx += xs[i] * xs[i];
          sxy += xs[i] * ys[i];
          syy += ys[i] * ys[i];
        }
        const denom = n * sxx - sx * sx;
        if (denom > 0) {
          const slope = (n * sxy - sx * sy) / denom; // dB per octave
          const varY = n * syy - sy * sy;
          const r2 = varY > 0 ? Math.pow(n * sxy - sx * sy, 2) / (denom * varY) : 0;
          if (slope >= DETECT.pinkSlopeMin && slope <= DETECT.pinkSlopeMax && r2 >= DETECT.pinkR2Min) {
            raw.push({
              id: 'pink_noise',
              label: 'PINK-NOISE CHARACTER',
              detail: `broadband, spectral slope ≈ ${slope.toFixed(1)} dB/oct over 100 Hz–10 kHz`,
              severity: 'amber',
            });
          }
        }
      }
    }

    // ---- Excessive LF rumble: energy below 60 Hz dominating everything above.
    {
      const split = Math.max(2, Math.floor(DETECT.rumbleSplitHz / hzPerBin));
      let lowPow = 0;
      let hiPow = 0;
      let lowPeakDb = -Infinity;
      for (let i = 1; i < spec.length; i++) {
        const p = Math.pow(10, spec[i] / 10);
        if (i < split) {
          lowPow += p;
          if (spec[i] > lowPeakDb) lowPeakDb = spec[i];
        } else {
          hiPow += p;
        }
      }
      if (lowPow > hiPow && lowPeakDb >= DETECT.rumbleMinPeakDb) {
        raw.push({
          id: 'lf_rumble',
          label: 'LF RUMBLE',
          detail: `energy below ${DETECT.rumbleSplitHz} Hz dominates the spectrum (peak ${lowPeakDb.toFixed(0)} dBFS)`,
          severity: 'amber',
        });
      }
    }

    // ---- Feedback beginning: ONE narrowband component rising monotonically
    // over ~1.5 s. Tracker: the global narrowband peak per tick; a frequency
    // jump clears the history (it is not the SAME component any more).
    {
      const start = Math.max(1, Math.ceil(60 / hzPerBin));
      let best = -Infinity;
      let bestI = start;
      for (let i = start; i < spec.length; i++) {
        if (spec[i] > best) {
          best = spec[i];
          bestI = i;
        }
      }
      const median = coarseMedianDb(spec, hzPerBin, 60);
      const narrow = Number.isFinite(best) && Number.isFinite(median) && best - median >= DETECT.fbNarrowAboveMedianDb;
      if (narrow) {
        const hz = bestI * hzPerBin;
        const hist = state.peakHist;
        const last = hist.length > 0 ? hist[hist.length - 1] : null;
        const sameComponent = last != null && Math.abs(hz / last.hz - 1) <= DETECT.fbHzTolFrac * 2;
        const kept = sameComponent ? hist : [];
        next.peakHist = [...kept, { tMs, hz, db: best }].filter((e) => tMs - e.tMs <= DETECT.fbWindowMs + 400);
      } else {
        next.peakHist = [];
      }
      const h = next.peakHist;
      if (h.length >= 6 && h[h.length - 1].tMs - h[0].tMs >= DETECT.fbWindowMs * 0.9) {
        const latest = h[h.length - 1];
        let monotonic = latest.db >= DETECT.fbMinLevelDb;
        for (let i = 1; i < h.length && monotonic; i++) {
          if (h[i].db < h[i - 1].db - DETECT.fbStepTolDb) monotonic = false;
          if (Math.abs(h[i].hz / latest.hz - 1) > DETECT.fbHzTolFrac) monotonic = false;
        }
        if (monotonic && latest.db - h[0].db >= DETECT.fbMinRiseDb) {
          raw.push({
            id: 'feedback',
            label: 'FEEDBACK BEGINNING',
            detail: `narrowband component at ~${fmtHz(latest.hz)} rising steadily (+${(latest.db - h[0].db).toFixed(1)} dB)`,
            severity: 'red',
          });
        }
      }
    }

    // ---- Narrowband whistle: confident single high tone with few harmonics.
    if (
      pitch &&
      pitch.voiced &&
      pitch.confidence >= DETECT.whistleConfMin &&
      pitch.freq >= DETECT.whistleMinHz &&
      pitch.levelDb >= DETECT.whistleMinLevelDb
    ) {
      const fund = narrowPeak(spec, hzPerBin, pitch.freq, 0.03);
      const h2 = 2 * pitch.freq < nyquist ? narrowPeak(spec, hzPerBin, 2 * pitch.freq, 0.03) : null;
      const h3 = 3 * pitch.freq < nyquist ? narrowPeak(spec, hzPerBin, 3 * pitch.freq, 0.03) : null;
      const few =
        fund != null &&
        (h2 == null || h2.db <= fund.db - DETECT.whistleHarmonicDropDb) &&
        (h3 == null || h3.db <= fund.db - DETECT.whistleHarmonicDropDb);
      if (few) {
        raw.push({
          id: 'whistle',
          label: 'NARROWBAND WHISTLE',
          detail: `stable single tone ≈ ${fmtHz(pitch.freq)}, few harmonics`,
          severity: 'amber',
        });
      }
    }
  } else {
    // No spectrum this tick — the feedback tracker cannot follow its component.
    next.peakHist = [];
  }

  return { raw, state: next };
}

// ---------------------------------------------------------------------------
// Hysteresis — chips appear after ~0.7 s persistence, clear after ~1.5 s absence
// ---------------------------------------------------------------------------

export type ChipEntry = { firstMs: number; lastMs: number; det: Detection };
export type ChipState = Record<string, ChipEntry>;

export function applyHysteresis(
  prev: ChipState,
  raw: Detection[],
  tMs: number,
): { chips: Detection[]; next: ChipState } {
  const next: ChipState = {};
  const rawById = new Map(raw.map((d) => [d.id as string, d]));
  const ids = new Set<string>([...Object.keys(prev), ...rawById.keys()]);
  for (const id of ids) {
    const p = prev[id];
    const r = rawById.get(id);
    if (r) next[id] = { firstMs: p ? p.firstMs : tMs, lastMs: tMs, det: r };
    else if (p && tMs - p.lastMs <= DETECT.clearMs) next[id] = p; // absent, but not yet cleared
  }
  const chips = Object.values(next)
    .filter((e) => tMs - e.firstMs >= DETECT.appearMs)
    .map((e) => e.det);
  chips.sort((a, b) =>
    a.severity === b.severity ? a.label.localeCompare(b.label) : a.severity === 'red' ? -1 : 1,
  );
  return { chips, next };
}
