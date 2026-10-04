/**
 * Calc — FULL PRE-LAUNCH ACCURACY AUDIT (owner 2026-10-04), receipts.
 *
 * Part 1 pins TWO independent hand-computed vectors (one ordinary, one edge)
 * for every one of the 163 calculator functions. The expected values are
 * written here from the published formulas — never by calling the app — so a
 * wrong constant, unit, sign or domain rule anywhere fails a line below.
 *   'R' = the inputs must be refused in words (a refusal row, D53);
 *   'E' = the "no valid result" state (a throw / every number NaN);
 *   'T:…' = a row must carry these words.
 *
 * Part 2 pins each fix the audit made (A1–A16). Every one fails on HEAD
 * d0449070-era code:
 *   A1  Voltage Drop costed copper at 20 °C only — a loaded cable (75 °C, the
 *       NEC Ch. 9 Table 8 basis) dropped ~22% MORE than shown. Now a ranged
 *       CONDUCTOR TEMPERATURE input; ρ is the exact IACS 1/58 µΩ·m. A drop-only
 *       gauge finer than 40 AWG ("92 AWG") is said in words.
 *   A2  Speaker Cable Loss used a hand-typed Ω/m table that disagreed with
 *       Voltage Drop about the same wire (16 AWG 0.01318 vs 0.013173).
 *   A3  1 W = 3.4121 BTU/hr (was 3.412).
 *   A4  Allowable time printed "256 hours" for 70 dBA under NIOSH (which counts
 *       nothing below 80 dBA) — now "no limit" in words; OSHA 80–90 dBA says it
 *       counts toward the action level only. NIOSH's 140 is a PEAK limit.
 *   A5  Critical distance: exact √(0.161/16π) = 0.0566 (was 0.057, +0.7%).
 *   A6  Sabine from a surface list says when ā > 0.3 and gives Eyring.
 *   A7  Panel absorber: (c/2π)·√(ρ₀/(m·d)) = 59.94 (was 60).
 *   A8  Crossover constants at full precision.
 *   A9  Driver excursion: ρ₀ = 1.2041 (was 1.2); the near field is refused.
 *   A10 A port longer than λ/12 is flagged (lumped model limit).
 *   A11 Bit depth: 6.02·N + 1.76 was called "the dithered ideal" — it is the
 *       UNdithered one; TPDF dither costs 4.77 dB. Exact 20·log₁₀2 constants.
 *   A12 FIR: a transition band ≥ fs/2 is refused.
 *   A13 RF: Friis inside one wavelength printed a path GAIN — refused.
 *   A14 Round trip: "ONE-WAY (INPUT SIDE)" split processing 50/50 on no basis.
 *   A15 Compressor ratio for an unreachable target: refused in words.
 *   A16 Wording: limiter step spacing; "SPL cannot be negative" was false.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');

// Independent hand-formula test vectors: two per calculator function (one
// ordinary, one edge). Expected values are computed HERE from the published
// formulas, written fresh — never by calling the app's code.
const L10 = Math.log10, sq = Math.sqrt, PI = Math.PI, pw = Math.pow;
const C = (T: number) => 331.3 * sq(1 + T / 273.15);
const c20 = C(20), c0 = C(0), c30 = C(30), cm10 = C(-10);
const DBU = sq(0.6), PREF = 2e-5;
const rhoCu = (T: number) => (1 / 58e6) * (1 + 0.00393 * (T - 20));
const awgA = (g: number) => { const d = 0.127e-3 * pw(92, (36 - g) / 39); return PI * d * d / 4; };
const awgFromA = (A: number) => 36 - 39 * (Math.log(2000 * sq(A / PI) / 0.127) / Math.log(92));
const allowN = (L: number) => 480 / pw(2, (L - 85) / 3), allowO = (L: number) => 480 / pw(2, (L - 90) / 5);
const BTU = 3600 / 1055.05585262;
const RHOA = 101325 / (287.05 * 293.15);
const DBB = 20 * L10(2), FS = 10 * L10(1.5);
const K_FSPL = -20 * L10(4 * PI / 299792458);
const edges = (fc: number, q: number) => { const r = sq(1 + 1 / (4 * q * q)); return [fc * (r - 1 / (2 * q)), fc * (r + 1 / (2 * q))]; };

// R = refused (a refusal row), E = compute error (throws / all NaN), T = text row contains
const V: [string, string, Record<string, unknown>, Record<string, number> | string][] = [
  // ── wave
  ['wave', 'period', { f: 1000 }, { PERIOD: 1e-3 }],
  ['wave', 'period', { f: 0.5 }, { PERIOD: 2 }],
  ['wave', 'freq', { t: 0.02 }, { FREQUENCY: 50, 'ANGULAR FREQUENCY ω (rad/s)': 100 * PI }],
  ['wave', 'freq', { t: 1e-6 }, { FREQUENCY: 1e6 }],
  ['wave', 'speed', { temp: 20 }, { 'SPEED OF SOUND': c20, 'DELAY PER METER': 1 / c20 }],
  ['wave', 'speed', { temp: -10 }, { 'SPEED OF SOUND': cm10, 'DELAY PER FOOT': 0.3048 / cm10 }],
  ['wave', 'wavelength', { f: 100, temp: 20 }, { 'WAVELENGTH λ': c20 / 100, 'QUARTER WAVE λ/4': c20 / 400 }],
  ['wave', 'wavelength', { f: 20000, temp: 30 }, { 'WAVELENGTH λ': c30 / 20000 }],
  ['wave', 'distToFreq', { dist: 3.43, temp: 20 }, { 'FULL-WAVE FREQUENCY': c20 / 3.43, 'QUARTER-WAVE FREQUENCY (boundary cancel region)': c20 / 13.72 }],
  ['wave', 'distToFreq', { dist: 0.01, temp: 0 }, { 'FULL-WAVE FREQUENCY': c0 / 0.01 }],
  ['wave', 'cycles', { fKnown: 1000, dist: 1, temp: 20 }, { 'CYCLES IN THE DISTANCE': 1000 / c20, 'RESIDUAL PHASE OFFSET': ((1000 / c20) % 1) * 360 }],
  ['wave', 'cycles', { fKnown: c20, dist: 3, temp: 20 }, { 'CYCLES IN THE DISTANCE': 3, 'RESIDUAL PHASE OFFSET': 0 }],
  // ── distdelay
  ['distdelay', 'distToDelay', { dist: 30, temp: 20 }, { DELAY: 30 / c20 }],
  ['distdelay', 'distToDelay', { dist: 0, temp: 20 }, { DELAY: 0 }],
  ['distdelay', 'delayToDist', { delay: 0.01, temp: 20 }, { DISTANCE: 0.01 * c20 }],
  ['distdelay', 'delayToDist', { delay: 0.01, temp: -10 }, { DISTANCE: 0.01 * cm10 }],
  ['distdelay', 'smpToTime', { smp: 4800, sr: 48000, temp: 20 }, { TIME: 0.1, 'EQUIVALENT DISTANCE IN AIR': 0.1 * c20 }],
  ['distdelay', 'smpToTime', { smp: 1, sr: 192000, temp: 20 }, { TIME: 1 / 192000 }],
  ['distdelay', 'timeToSmp', { delay: 0.009, sr: 48000 }, { 'EXACT SAMPLES': 432 }],
  ['distdelay', 'timeToSmp', { delay: 0.0001, sr: 44100 }, { 'EXACT SAMPLES': 4.41 }],
  // ── phase
  ['phase', 'phaseFromTime', { f: 1000, dt: 0.0005 }, { 'PHASE (WRAPPED 0–360°)': 180, 'TOTAL PHASE ROTATION': 180 }],
  ['phase', 'phaseFromTime', { f: 1000, dt: 0.011 / 1000 * 1000 }, { 'PHASE (WRAPPED 0–360°)': 0, 'FULL CYCLES LATE': 11 }],
  ['phase', 'timeFromPhase', { phi: 90, f: 1000 }, { 'SMALLEST TIME OFFSET': 0.00025 }],
  ['phase', 'timeFromPhase', { phi: -90, f: 1000 }, { 'SMALLEST TIME OFFSET': 0.00075 }],
  ['phase', 'phaseFromDist', { pathDiff: 0.17, f: 1000, temp: 20 }, { 'TIME OFFSET': 0.17 / c20, 'TOTAL PHASE ROTATION': 360 * 1000 * 0.17 / c20 }],
  ['phase', 'phaseFromDist', { pathDiff: 0, f: 1000, temp: 20 }, { 'TIME OFFSET': 0, 'PHASE (WRAPPED 0–360°)': 0 }],
  ['phase', 'alignFreqs', { dt: 0.0005 }, { 'FIRST 90° FREQUENCY': 500, 'FIRST 180° FREQUENCY (first cancel)': 1000, 'FIRST 360° FREQUENCY (first re-sum)': 2000 }],
  ['phase', 'alignFreqs', { dt: 1e-5 }, { 'FIRST 180° FREQUENCY (first cancel)': 50000 }],
  // ── comb
  ['comb', 'combFromDelay', { dt: 0.0005 }, { 'FIRST NULL': 1000, 'NULL/NULL SPACING': 2000 }],
  ['comb', 'combFromDelay', { dt: 0.05 }, { 'FIRST NULL': 10 }],
  ['comb', 'combFromPath', { pathDiff: 0.17, temp: 20 }, { 'FIRST NULL': c20 / 0.34 }],
  ['comb', 'combFromPath', { pathDiff: 0, temp: 20 }, 'R'],
  // ── latency
  ['latency', 'bufLatency', { buf: 128, sr: 48000 }, { 'BUFFER LATENCY': 128 / 48000, 'BUFFERS PER SECOND': 375 }],
  ['latency', 'bufLatency', { buf: 1, sr: 44100 }, { 'BUFFER LATENCY': 1 / 44100 }],
  ['latency', 'roundTrip', { inBuf: 128, outBuf: 128, proc: 0.0015, sr: 48000 }, { 'ROUND-TRIP LATENCY': 256 / 48000 + 0.0015, 'INPUT BUFFER ALONE': 128 / 48000 }],
  ['latency', 'roundTrip', { inBuf: 32, outBuf: 64, proc: 0, sr: 96000 }, { 'ROUND-TRIP IN SAMPLES': 96 }],
  ['latency', 'smpToMs', { smp: 65536, sr: 48000 }, { TIME: 65536 / 48000 }],
  ['latency', 'smpToMs', { smp: 0, sr: 48000 }, { TIME: 0 }],
  ['latency', 'msToSmp', { t: 0.0068, sr: 48000 }, { 'EXACT SAMPLES': 326.4 }],
  ['latency', 'msToSmp', { t: 0.35, sr: 44100 }, { 'EXACT SAMPLES': 15435 }],
  // ── fft
  ['fft', 'resFromSize', { N: 4096, sr: 48000, fInterest: 100 }, { 'BIN SPACING': 48000 / 4096, 'WINDOW DURATION': 4096 / 48000, 'CYCLES OF YOUR FREQUENCY IN THE WINDOW': 100 * 4096 / 48000 }],
  ['fft', 'resFromSize', { N: 0, sr: 48000, fInterest: 100 }, 'E'],
  ['fft', 'sizeFromRes', { df: 5, sr: 48000 }, { 'MINIMUM FFT SIZE': 9600, 'ACTUAL RESOLUTION AT THAT SIZE': 48000 / 16384 }],
  ['fft', 'sizeFromRes', { df: 0, sr: 48000 }, 'E'],
  ['fft', 'tradeoff', { N: 1024, sr: 48000 }, { 'BIN SPACING': 46.875, 'WINDOW DURATION': 1024 / 48000 }],
  ['fft', 'tradeoff', { N: 1, sr: 48000 }, { 'BIN SPACING': 48000 }],
  // ── level
  ['level', 'dbuToV', { dbu: 4 }, { 'VOLTAGE (RMS)': DBU * pw(10, 0.2), 'SAME LEVEL IN dBV': 4 + 20 * L10(DBU) }],
  ['level', 'dbuToV', { dbu: 0 }, { 'VOLTAGE (RMS)': 0.7745966692414834 }],
  ['level', 'vToDbu', { vFromDbu: 1.228 }, { 'LEVEL (dBu)': 20 * L10(1.228 / DBU) }],
  ['level', 'vToDbu', { vFromDbu: DBU }, { 'LEVEL (dBu)': 0 }],
  ['level', 'dbvToV', { dbv: -10 }, { 'VOLTAGE (RMS)': pw(10, -0.5) }],
  ['level', 'dbvToV', { dbv: 0 }, { 'VOLTAGE (RMS)': 1, 'SAME LEVEL IN dBu': -20 * L10(DBU) }],
  ['level', 'vToDbv', { vFromDbv: 0.316 }, { 'LEVEL (dBV)': 20 * L10(0.316) }],
  ['level', 'vToDbv', { vFromDbv: 1 }, { 'LEVEL (dBV)': 0 }],
  ['level', 'dbuDbv', { dbx: 4 }, { 'IF THIS IS dBu → in dBV': 4 - 2.218487496163564, 'IF THIS IS dBV → in dBu': 4 + 2.218487496163564 }],
  ['level', 'dbuDbv', { dbx: -60 }, { 'IF THIS IS dBu → in dBV': -62.218487496163564 }],
  ['level', 'ampToDb', { ampRatio: 2 }, { 'LEVEL CHANGE': 6.020599913279624 }],
  ['level', 'ampToDb', { ampRatio: 1 }, { 'LEVEL CHANGE': 0 }],
  ['level', 'powToDb', { powRatio: 2 }, { 'LEVEL CHANGE': 3.010299956639812 }],
  ['level', 'powToDb', { powRatio: 0.001 }, { 'LEVEL CHANGE': -30 }],
  ['level', 'dbToAmp', { dbAmp: 6 }, { 'AMPLITUDE RATIO': pw(10, 0.3) }],
  ['level', 'dbToAmp', { dbAmp: -120 }, { 'AMPLITUDE RATIO': 1e-6 }],
  ['level', 'dbToPow', { dbPow: 3 }, { 'POWER RATIO': pw(10, 0.3) }],
  ['level', 'dbToPow', { dbPow: 0 }, { 'POWER RATIO': 1 }],
  ['level', 'pctToDb', { pct: 50 }, { 'LEVEL CHANGE': 20 * L10(1.5) }],
  ['level', 'pctToDb', { pct: -100 }, 'R'],
  // ── ohmspower
  ['ohmspower', 'pFromVZ', { vrms: 28.3, z: 8 }, { POWER: 28.3 * 28.3 / 8, CURRENT: 28.3 / 8 }],
  ['ohmspower', 'pFromVZ', { vrms: 0, z: 8 }, { POWER: 0 }],
  ['ohmspower', 'powerFromPeak', { vpk: 40, z: 8 }, { 'AVERAGE POWER': 100 }],
  ['ohmspower', 'powerFromPeak', { vpk: 1, z: 1 }, { 'AVERAGE POWER': 0.5 }],
  ['ohmspower', 'vFromPZ', { p: 100, z: 8 }, { 'VOLTAGE (RMS)': sq(800), CURRENT: sq(12.5) }],
  ['ohmspower', 'vFromPZ', { p: 1e-3, z: 600 }, { 'VOLTAGE (RMS)': DBU }],
  ['ohmspower', 'iFromPV', { p: 100, vrms: 28.28 }, { CURRENT: 100 / 28.28 }],
  ['ohmspower', 'iFromPV', { p: 1, vrms: 1 }, { CURRENT: 1 }],
  ['ohmspower', 'zFromVP', { vrms: 20, p: 100 }, { IMPEDANCE: 4 }],
  ['ohmspower', 'zFromVP', { vrms: 70.7, p: 10 }, { IMPEDANCE: 70.7 * 70.7 / 10 }],
  ['ohmspower', 'rmsToPeak', { vrms: 28.3 }, { 'PEAK VOLTAGE': 28.3 * Math.SQRT2, 'PEAK-TO-PEAK VOLTAGE': 56.6 * Math.SQRT2 }],
  ['ohmspower', 'rmsToPeak', { vrms: 0 }, { 'PEAK VOLTAGE': 0 }],
  ['ohmspower', 'peakToRms', { vpk: 40 }, { 'VOLTAGE (RMS)': 40 / Math.SQRT2, 'PEAK-TO-PEAK VOLTAGE': 80 }],
  ['ohmspower', 'peakToRms', { vpk: Math.SQRT2 }, { 'VOLTAGE (RMS)': 1 }],
  // ── electronics
  ['electronics', 'seriesR', { rlist: [8, 8, 16] }, { 'TOTAL RESISTANCE': 32 }],
  ['electronics', 'seriesR', { rlist: [0] }, { 'TOTAL RESISTANCE': 0 }],
  ['electronics', 'parallelR', { rlist: [8, 8] }, { 'TOTAL RESISTANCE': 4 }],
  ['electronics', 'parallelR', { rlist: [8, 0] }, { 'TOTAL RESISTANCE': 0 }],
  ['electronics', 'divider', { vin: 1, r1: 10000, r2: 10000 }, { 'OUTPUT VOLTAGE': 0.5, ATTENUATION: -6.020599913279624 }],
  ['electronics', 'divider', { vin: 0, r1: 9000, r2: 1000 }, { 'OUTPUT VOLTAGE': 0, ATTENUATION: -20 }],
  ['electronics', 'xc', { f: 1000, cap: 1 }, { 'CAPACITIVE REACTANCE': 1 / (2 * PI * 1000 * 1e-6) }],
  ['electronics', 'xc', { f: 20, cap: 1000 }, { 'CAPACITIVE REACTANCE': 1 / (2 * PI * 20 * 1e-3) }],
  ['electronics', 'xl', { f: 1000, ind: 10 }, { 'INDUCTIVE REACTANCE': 2 * PI * 10 }],
  ['electronics', 'xl', { f: 20000, ind: 0.001 }, { 'INDUCTIVE REACTANCE': 2 * PI * 20000 * 1e-6 }],
  ['electronics', 'rcCutoff', { r: 10000, cap: 1 }, { 'CUTOFF FREQUENCY (−3 dB)': 1 / (2 * PI * 0.01) }],
  ['electronics', 'rcCutoff', { r: 1, cap: 1e6 }, { 'CUTOFF FREQUENCY (−3 dB)': 1 / (2 * PI) }],
  ['electronics', 'rcTau', { r: 10000, cap: 1 }, { 'TIME CONSTANT τ': 0.01 }],
  ['electronics', 'rcTau', { r: 0, cap: 1 }, { 'TIME CONSTANT τ': 0 }],
  // ── qbw
  ['qbw', 'geoCenter', { flo: 100, fhi: 400 }, { 'CENTER FREQUENCY (geometric)': 200, 'WIDTH IN OCTAVES': 2, 'Q OF THIS BAND': 200 / 300 }],
  ['qbw', 'geoCenter', { flo: 400, fhi: 400 }, { 'CENTER FREQUENCY (geometric)': 400, 'BANDWIDTH': 0 }],
  ['qbw', 'bwFromQ', { fc: 1000, q: 1.41 }, { BANDWIDTH: 1000 / 1.41, 'LOWER EDGE f₁ (−3 dB)': edges(1000, 1.41)[0], 'UPPER EDGE f₂ (−3 dB)': edges(1000, 1.41)[1] }],
  ['qbw', 'bwFromQ', { fc: 1000, q: 0.1 }, { 'LOWER EDGE f₁ (−3 dB)': edges(1000, 0.1)[0] }],
  ['qbw', 'qFromBw', { fc: 1000, bw: 709 }, { Q: 1000 / 709 }],
  ['qbw', 'qFromBw', { fc: 100, bw: 1000 }, { Q: 0.1 }],
  ['qbw', 'octFromQ', { q: Math.SQRT2 }, { 'WIDTH IN OCTAVES': 1 }],
  ['qbw', 'octFromQ', { q: 4.318473046963146 }, { 'WIDTH IN OCTAVES': 1 / 3 }],
  ['qbw', 'qFromOct', { noct: 1 }, { Q: Math.SQRT2 }],
  ['qbw', 'qFromOct', { noct: 2 }, { Q: 2 / 3 }],
  ['qbw', 'paramReach', { fc: 1000, q: 1.41, gain: 9 }, { 'AFFECTED RANGE — LOWER f₁': edges(1000, 1.41)[0] }],
  ['qbw', 'paramReach', { fc: 50, q: 10, gain: 0 }, { 'AFFECTED RANGE — UPPER f₂': edges(50, 10)[1] }],
  // ── compressor
  ['compressor', 'outFromRatio', { thr: -20, ratio: 4, inLvl: -8 }, { 'OUTPUT LEVEL': -17, 'GAIN REDUCTION': 9 }],
  ['compressor', 'outFromRatio', { thr: -20, ratio: 0.5, inLvl: -8 }, 'R'],
  ['compressor', 'ratioForOut', { thr: -20, inLvl: -8, targetOut: -17 }, { 'REQUIRED RATIO (n:1)': 4 }],
  ['compressor', 'ratioForOut', { thr: -20, inLvl: -8, targetOut: -25 }, 'R'],
  ['compressor', 'thrForGr', { inLvl: -8, ratio: 4, targetGr: 9 }, { 'SET THRESHOLD TO': -20 }],
  ['compressor', 'thrForGr', { inLvl: -8, ratio: 1, targetGr: 3 }, 'R'],
  // ── spldist
  ['spldist', 'point', { l1: 100, d1: 2, d2: 16 }, { 'LEVEL AT d₂': 100 - 20 * L10(8) }],
  ['spldist', 'point', { l1: 100, d1: 1, d2: 1 }, { 'LEVEL AT d₂': 100 }],
  ['spldist', 'line', { l1: 100, d1: 2, d2: 16 }, { 'LEVEL AT d₂ (idealized line source)': 100 - 10 * L10(8) }],
  ['spldist', 'line', { l1: 90, d1: 10, d2: 1 }, { 'LEVEL AT d₂ (idealized line source)': 100 }],
  ['spldist', 'custom', { l1: 100, d1: 1, d2: 8, rate: 4.5 }, { 'LEVEL AT d₂': 100 - 13.5 }],
  ['spldist', 'custom', { l1: 100, d1: 1, d2: 8, rate: 0 }, { 'LEVEL AT d₂': 100 }],
  ['spldist', 'required', { lTarget: 96, d1: 1, d2: 8 }, { 'REQUIRED LEVEL AT d₁': 96 + 20 * L10(8) }],
  ['spldist', 'required', { lTarget: 96, d1: 8, d2: 1 }, { 'REQUIRED LEVEL AT d₁': 96 - 20 * L10(8) }],
  // ── spladd
  ['spladd', 'combine', { levels: [95, 92, 88] }, { 'COMBINED LEVEL': 10 * L10(pw(10, 9.5) + pw(10, 9.2) + pw(10, 8.8)) }],
  ['spladd', 'combine', { levels: [-10] }, { 'COMBINED LEVEL': -10 }],
  ['spladd', 'identical', { lvl: 95, count: 4 }, { 'COMBINED LEVEL': 95 + 10 * L10(4) }],
  ['spladd', 'identical', { lvl: 95, count: 1 }, { 'COMBINED LEVEL': 95 }],
  ['spladd', 'needed', { delta: 6 }, { 'EXACT SOURCE MULTIPLE': pw(10, 0.6) }],
  ['spladd', 'needed', { delta: 0 }, { 'EXACT SOURCE MULTIPLE': 1 }],
  ['spladd', 'dominance', { la: 95, lb: 84 }, { 'COMBINED LEVEL': 10 * L10(pw(10, 9.5) + pw(10, 8.4)) }],
  ['spladd', 'dominance', { la: 90, lb: 90 }, { 'COMBINED LEVEL': 90 + 10 * L10(2) }],
  // ── dose
  ['dose', 'allowNiosh', { lex: 97 }, { 'ALLOWABLE TIME (85 dBA / 3 dB / 8 h)': allowN(97) * 60 }],
  ['dose', 'allowNiosh', { lex: 70 }, 'T:No limit'],
  ['dose', 'allowOsha', { lex: 95 }, { 'ALLOWABLE TIME (90 dBA / 5 dB / 8 h)': 240 * 60 }],
  ['dose', 'allowOsha', { lex: 75 }, 'T:No limit'],
  ['dose', 'doseNiosh', { doseLevels: [85, 94, 100], doseMins: [240, 90, 30] }, { 'DAILY DOSE (85 dBA / 3 dB)': (240 / allowN(85) + 90 / allowN(94) + 30 / allowN(100)) * 100 }],
  ['dose', 'doseNiosh', { doseLevels: [79.9, 80], doseMins: [480, 480] }, { 'DAILY DOSE (85 dBA / 3 dB)': 480 / allowN(80) * 100 }],
  ['dose', 'doseOsha', { doseLevels: [85, 94, 100], doseMins: [240, 90, 30] }, { 'PEL DOSE (≥ 90 dBA / 5 dB)': (90 / allowO(94) + 30 / allowO(100)) * 100, 'ACTION-LEVEL DOSE (≥ 80 dBA / 5 dB)': (240 / allowO(85) + 90 / allowO(94) + 30 / allowO(100)) * 100 }],
  ['dose', 'doseOsha', { doseLevels: [90], doseMins: [480] }, { 'PEL DOSE (≥ 90 dBA / 5 dB)': 100, 'ACTION-LEVEL DOSE (≥ 80 dBA / 5 dB)': 100 }],
  ['dose', 'leq', { doseLevels: [100, 70], doseMins: [60, 60] }, { 'Leq OVER THE INTERVALS': 10 * L10((pw(10, 10) + pw(10, 7)) / 2) }],
  ['dose', 'leq', { doseLevels: [90], doseMins: [0] }, 'R'],
  // ── micgain
  ['micgain', 'micout', { sens: 2, spl: 94 }, { 'OUTPUT VOLTAGE': 0.002 * PREF * pw(10, 4.7), 'OUTPUT LEVEL (dBu)': 20 * L10(0.002 * PREF * pw(10, 4.7) / DBU) }],
  ['micgain', 'micout', { sens: 1000, spl: 93.97940008672037 }, { 'OUTPUT VOLTAGE': 1 }],
  ['micgain', 'gain', { sens: 2, spl: 94, target: 4, headroom: 12 }, { 'GAIN TO HIT TARGET (dB)': 4 - 20 * L10(0.002 * PREF * pw(10, 4.7) / DBU) }],
  ['micgain', 'gain', { sens: 20, spl: 120, target: 4, headroom: 0 }, { 'GAIN TO HIT TARGET (dB)': 4 - 20 * L10(0.02 * PREF * pw(10, 6) / DBU) }],
  ['micgain', 'maxspl', { sens: 2, maxIn: 10 }, { 'SPL AT PREAMP INPUT CLIP': 20 * L10(1 / PREF) + 10 - 20 * L10(0.002 / DBU) }],
  ['micgain', 'maxspl', { sens: 1000 * DBU, maxIn: 0 }, { 'SPL AT PREAMP INPUT CLIP': 20 * L10(1 / PREF) }],
  // ── limiter
  ['limiter', 'maxv', { pwr: 500, z: 8 }, { 'MAX CONTINUOUS VOLTAGE': sq(4000), 'AS A LEVEL (dBu)': 20 * L10(sq(4000) / DBU) }],
  ['limiter', 'maxv', { pwr: 1e-3, z: 600 }, { 'AS A LEVEL (dBu)': 0 }],
  ['limiter', 'threshold', { pwr: 500, z: 8, ampGain: 32, margin: 3 }, { 'THRESHOLD (dBu)': 20 * L10(sq(4000) / DBU) - 35 }],
  ['limiter', 'threshold', { pwr: 1e-3, z: 600, ampGain: 0, margin: 0 }, { 'THRESHOLD (dBu)': 0, 'THRESHOLD VOLTAGE': DBU }],
  // ── speakerpower
  ['speakerpower', 'predictspl', { sens: 97, power: 500, dist: 10, headroom: 6, nspk: 1 }, { 'PREDICTED SPL (one speaker, after headroom)': 97 + 10 * L10(500) - 20 - 6 }],
  ['speakerpower', 'predictspl', { sens: 97, power: 1, dist: 1, headroom: 0, nspk: 4 }, { 'PREDICTED SPL (one speaker, after headroom)': 97 }],
  ['speakerpower', 'reqpower', { sens: 97, target: 105, dist: 10, headroom: 6, nspk: 1 }, { 'REQUIRED POWER (one speaker)': pw(10, 3.4) }],
  ['speakerpower', 'reqpower', { sens: 97, target: 97, dist: 1, headroom: 0, nspk: 2 }, { 'REQUIRED POWER (one speaker)': 1 }],
  ['speakerpower', 'maxspl', { sens: 97, power: 500, dist: 20 }, { 'MAX SPL AT THE LISTENER': 97 + 10 * L10(500) - 20 * L10(20) }],
  ['speakerpower', 'maxspl', { sens: 90, power: 1, dist: 1 }, { 'MAX SPL AT THE LISTENER': 90 }],
  // ── impedance
  ['impedance', 'parallel', { zlist: [8, 8, 4] }, { 'TOTAL PARALLEL IMPEDANCE': 2 }],
  ['impedance', 'parallel', { zlist: [8, 0] }, 'E'],
  ['impedance', 'series', { zlist: [8, 8, 4] }, { 'TOTAL SERIES IMPEDANCE': 20 }],
  ['impedance', 'series', { zlist: [16] }, { 'TOTAL SERIES IMPEDANCE': 16 }],
  ['impedance', 'seriesparallel', { z4: [8, 8, 8, 8] }, { 'TOTAL IMPEDANCE': 8 }],
  ['impedance', 'seriesparallel', { z4: [8, 8, 8] }, 'R'],
  // ── cable (20 °C copper, shared model)
  ['cable', 'loss', { len: 30, awg: 16, z: 8, pamp: 500 }, { 'LOOP RESISTANCE (16 AWG)': 60 * rhoCu(20) / awgA(16), 'LEVEL LOSS': 20 * L10(8 / (8 + 60 * rhoCu(20) / awgA(16))) }],
  ['cable', 'loss', { len: 0, awg: 12, z: 4, pamp: 100 }, { 'LEVEL LOSS': 0 }],
  ['cable', 'maxlen', { awg: 12, z: 8, maxloss: 0.5 }, { 'MAX ONE-WAY LENGTH (12 AWG)': 8 * (pw(10, 0.025) - 1) / (2 * rhoCu(20) / awgA(12)) }],
  ['cable', 'maxlen', { awg: 40, z: 4, maxloss: -1 }, { 'MAX ONE-WAY LENGTH (40 AWG)': 4 * (pw(10, 0.05) - 1) / (2 * rhoCu(20) / awgA(40)) }],
  ['cable', 'recgauge', { len: 30, z: 8, maxloss: 0.5 }, { 'ITS LOSS ON THIS RUN': 20 * L10(8 / (8 + 60 * rhoCu(20) / awgA(12))) }],
  ['cable', 'recgauge', { len: 1000, z: 4, maxloss: 0.1 }, 'T:NO LISTED GAUGE PASSES'],
  // ── cv70
  ['cv70', 'load', { taps: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], prated: 250, vline: 70.7, hr: 1 }, { 'SYSTEM LOAD (12 speakers)': 120, 'LINE CURRENT': 120 / 70.7, 'REMAINING AMP CAPACITY': 130 }],
  ['cv70', 'load', { taps: [100, 100, 130], prated: 250, vline: 100, hr: 1 }, { 'OVER THE AMP RATING BY': 80 }],
  ['cv70', 'morespeakers', { taps: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], prated: 250, tapw: 10, hr: 1 }, { 'USABLE BUDGET AFTER HEADROOM': 250 / pw(10, 0.1), 'LOAD IF FILLED': 190 }],
  ['cv70', 'morespeakers', { taps: [10], prated: 250, tapw: 0, hr: 1 }, 'E'],
  // ── bpm
  ['bpm', 'noteValues', { bpm: 120 }, { 'ONE BEAT (QUARTER NOTE)': 0.5, 'DOTTED 8TH': 0.375, '8TH-NOTE TRIPLET': 1 / 6 }],
  ['bpm', 'noteValues', { bpm: 60 }, { 'ONE BAR OF 4/4': 4 }],
  ['bpm', 'bpmFromInterval', { interval: 0.5 }, { TEMPO: 120 }],
  ['bpm', 'bpmFromInterval', { interval: 0.4615 }, { TEMPO: 60 / 0.4615 }],
  ['bpm', 'lfoSync', { bpm: 120, beatsPerCycle: 4 }, { 'LFO RATE': 0.5 }],
  ['bpm', 'lfoSync', { bpm: 120, beatsPerCycle: 0.5 }, { 'LFO RATE': 4 }],
  ['bpm', 'preDelay', { bpm: 120 }, { '1/64 NOTE': 0.5 / 16, '1/16 NOTE': 0.125 }],
  ['bpm', 'preDelay', { bpm: 300 }, { '1/32 NOTE': 0.2 / 8 }],
  // ── pitch
  ['pitch', 'freqToNote', { f: 452, ref: 440 }, { 'CENTS OFF': 1200 * Math.log2(452 / 440) }],
  ['pitch', 'freqToNote', { f: 0, ref: 440 }, 'E'],
  ['pitch', 'noteToFreq', { midi: 60, ref: 440 }, { FREQUENCY: 440 * pw(2, -9 / 12) }],
  ['pitch', 'noteToFreq', { midi: 0, ref: 440 }, { FREQUENCY: 440 * pw(2, -69 / 12) }],
  ['pitch', 'interval', { f: 440, f2: 660 }, { CENTS: 1200 * Math.log2(1.5), RATIO: 1.5 }],
  ['pitch', 'interval', { f: 440, f2: 220 }, { SEMITONES: -12 }],
  ['pitch', 'transpose', { semi: 12, cents: 0 }, { 'FREQUENCY RATIO': 2 }],
  ['pitch', 'transpose', { semi: -1, cents: 100 }, { 'FREQUENCY RATIO': 1 }],
  // ── filesize
  ['filesize', 'size', { sr: 48000, bits: 24, ch: 2, dur: 60 }, { 'FILE SIZE': 288000 * 60, 'DATA RATE': 2304000 }],
  ['filesize', 'size', { sr: 44100, bits: 16, ch: 1, dur: 0 }, { 'FILE SIZE': 0 }],
  ['filesize', 'recTime', { sr: 48000, bits: 24, ch: 2, storage: 64e9 }, { 'RECORDING TIME': 64e9 / 288000 }],
  ['filesize', 'recTime', { sr: 192000, bits: 32, ch: 64, storage: 1e12 }, { 'RECORDING TIME': 1e12 / (192000 * 4 * 64) }],
  ['filesize', 'multitrack', { sr: 48000, bits: 24, ch: 1, tracks: 24 }, { 'SESSION RATE PER MINUTE': 144000 * 24 * 60 }],
  ['filesize', 'multitrack', { sr: 48000, bits: 24, ch: 1, tracks: 0 }, { 'SESSION RATE PER MINUTE': 0 }],
  // ── roommodes
  ['roommodes', 'axial', { len: 5, wid: 4, hei: 2.5, temp: 20 }, 'T:' + (c20 / 10).toPrecision(4)],
  ['roommodes', 'axial', { len: 0, wid: 4, hei: 2.5, temp: 20 }, 'E'],
  ['roommodes', 'single', { dist: 3.2, temp: 20 }, { 'FUNDAMENTAL (n = 1)': c20 / 6.4, 'THIRD ORDER (n = 3)': 3 * c20 / 6.4 }],
  ['roommodes', 'single', { dist: 100, temp: 0 }, { 'FUNDAMENTAL (n = 1)': c0 / 200 }],
  // ── sabine
  ['sabine', 'rtFromVA', { vol: 100, absA: 54 }, { RT60: 0.161 * 100 / 54 }],
  ['sabine', 'rtFromVA', { vol: 1, absA: 0.161 }, { RT60: 1 }],
  ['sabine', 'rtFromSurfaces', { vol: 100, surfaces: [20, 20, 12.5], coeffs: [0.05, 0.3, 0.9] }, { 'TOTAL ABSORPTION A': 1 + 6 + 11.25, RT60: 16.1 / 18.25 }],
  ['sabine', 'rtFromSurfaces', { vol: 100, surfaces: [100], coeffs: [0.5] }, 'T:Eyring gives ' + (0.161 * 100 / (-100 * Math.log(0.5))).toPrecision(4)],
  ['sabine', 'neededA', { vol: 100, targetRt: 0.3, absA: 20 }, { 'ABSORPTION NEEDED': 16.1 / 0.3, 'ABSORPTION TO ADD': 16.1 / 0.3 - 20 }],
  ['sabine', 'neededA', { vol: 100, targetRt: 0.3, absA: 100 }, { 'ABSORPTION TO ADD': 0 }],
  // ── treatment
  ['treatment', 'panels', { vol: 150, rtCur: 1.2, rtTgt: 0.5, panelArea: 2.88, alpha: 0.9 }, { 'PANELS NEEDED': 11, 'ABSORPTION TO ADD ΔA': 0.161 * 150 * (2 - 1 / 1.2) }],
  ['treatment', 'panels', { vol: 150, rtCur: 0.5, rtTgt: 1.2, panelArea: 2.88, alpha: 0.9 }, { 'PANELS NEEDED': 0, 'ABSORPTION TO ADD ΔA': 0 }],
  // ── critdist (exact constant √(0.161/16π))
  ['critdist', 'dc', { vol: 300, rt60: 0.8, q: 1 }, { 'CRITICAL DISTANCE Dc': sq(0.161 * 300 / (0.8 * 16 * PI)) }],
  ['critdist', 'dc', { vol: 300, rt60: 0.8, q: 4 }, { 'CRITICAL DISTANCE Dc': 2 * sq(0.161 * 300 / (0.8 * 16 * PI)) }],
  ['critdist', 'drr', { vol: 300, rt60: 0.8, q: 1, r: 3 }, { 'DIRECT-TO-REVERBERANT RATIO': 20 * L10(sq(0.161 * 300 / (0.8 * 16 * PI)) / 3) }],
  ['critdist', 'drr', { vol: 300, rt60: 0.8, q: 1, r: sq(0.161 * 300 / (0.8 * 16 * PI)) }, { 'DIRECT-TO-REVERBERANT RATIO': 0 }],
  // ── schroeder
  ['schroeder', 'fs', { vol: 50, rt60: 0.4 }, { 'SCHROEDER FREQUENCY': 2000 * sq(0.008) }],
  ['schroeder', 'fs', { vol: 4e6, rt60: 4 }, { 'SCHROEDER FREQUENCY': 2 }],
  ['schroeder', 'volForFs', { fs: 200, rt60: 0.4 }, { 'REQUIRED VOLUME': 40 }],
  ['schroeder', 'volForFs', { fs: 2000, rt60: 1 }, { 'REQUIRED VOLUME': 1 }],
  // ── boundary
  ['boundary', 'sbir', { d: 0.6, temp: 20 }, { 'FIRST CANCELLATION': c20 / 2.4, 'FIRST REINFORCEMENT': c20 / 1.2 }],
  ['boundary', 'sbir', { d: 0.01, temp: 0 }, { 'FIRST CANCELLATION': c0 / 0.04 }],
  ['boundary', 'distForNull', { fNull: 150, temp: 20 }, { 'BOUNDARY DISTANCE': c20 / 600 }],
  ['boundary', 'distForNull', { fNull: 20, temp: -10 }, { 'BOUNDARY DISTANCE': cm10 / 80 }],
  // ── reflection
  ['reflection', 'comb', { dDirect: 0.3, dReflected: 0.75, temp: 20 }, { 'PATH DIFFERENCE': 0.45, 'FIRST NULL': c20 / 0.9 }],
  ['reflection', 'comb', { dDirect: 0.75, dReflected: 0.3, temp: 20 }, 'R'],
  ['reflection', 'pathForNull', { fNull: 400, temp: 20 }, { 'PATH DIFFERENCE': c20 / 800 }],
  ['reflection', 'pathForNull', { fNull: 20000, temp: 20 }, { 'ARRIVAL DELAY': 1 / 40000 }],
  // ── eyring
  ['eyring', 'eyring', { vol: 120, surf: 160, aBar: 0.3 }, { 'RT60 (EYRING)': 0.161 * 120 / (-160 * Math.log(0.7)), 'RT60 (SABINE)': 0.161 * 120 / 48 }],
  ['eyring', 'eyring', { vol: 120, surf: 160, aBar: 1 }, 'E'],
  ['eyring', 'absForRt', { vol: 120, surf: 160, rtTarget: 0.3 }, { 'REQUIRED AVERAGE ABSORPTION ā': 1 - Math.exp(-0.161 * 120 / 48) }],
  ['eyring', 'absForRt', { vol: 1, surf: 1e6, rtTarget: 10 }, { 'REQUIRED AVERAGE ABSORPTION ā': 1 - Math.exp(-0.161 / 1e7) }],
  // ── diffuser
  ['diffuser', 'qrd', { N: 7, f0: 500, w: 0.05, temp: 20 }, { 'DEEPEST WELL': 4 * (c20 / 500) / 14, 'HIGH DIFFUSION EDGE': c20 / 0.1 }],
  ['diffuser', 'qrd', { N: 200, f0: 500, w: 0.05, temp: 20 }, 'E'],
  // ── absorber
  ['absorber', 'panel', { mass: 5, gap: 0.05 }, { 'RESONANT FREQUENCY': (c20 / (2 * PI)) * sq(RHOA / 0.25) }],
  ['absorber', 'panel', { mass: 1, gap: 1 }, { 'RESONANT FREQUENCY': (c20 / (2 * PI)) * sq(RHOA) }],
  ['absorber', 'helmholtz', { openPct: 5, depth: 0.1, thick: 0.012, hole: 0.008, temp: 20 }, { 'RESONANT FREQUENCY': (c20 / (2 * PI)) * sq(0.05 / (0.1 * 0.0184)) }],
  ['absorber', 'helmholtz', { openPct: 100 - 1e-9, depth: 1, thick: 1, hole: 0, temp: 0 }, { 'RESONANT FREQUENCY': (c0 / (2 * PI)) * sq((1 - 1e-11)) }],
  // ── transloss
  ['transloss', 'massTL', { mass: 25, f: 125 }, { 'TRANSMISSION LOSS': 20 * L10(3125) - 47 }],
  ['transloss', 'massTL', { mass: 2, f: 63 }, 'R'],
  ['transloss', 'massForTL', { tlTarget: 40, f: 125 }, { 'REQUIRED PANEL MASS (kg/m²)': pw(10, 4.35) / 125 }],
  ['transloss', 'massForTL', { tlTarget: 1e-9, f: 1 }, { 'REQUIRED PANEL MASS (kg/m²)': pw(10, 47 / 20) }],
  // ── transformer
  ['transformer', 'ratioFromZ', { zp: 600, zs: 150 }, { 'TURNS RATIO (N:1)': 2, 'IMPEDANCE RATIO': 4 }],
  ['transformer', 'ratioFromZ', { zp: 8, zs: 5000 }, { 'TURNS RATIO (N:1)': sq(8 / 5000) }],
  ['transformer', 'zFromRatio', { turns: 2, zs: 150 }, { 'REFLECTED PRIMARY IMPEDANCE': 600 }],
  ['transformer', 'zFromRatio', { turns: 0.1, zs: 8 }, { 'REFLECTED PRIMARY IMPEDANCE': 0.08 }],
  // ── pads
  ['pads', 'tpad', { atten: 20, z: 600 }, { 'SERIES ARMS R1 = R2': 600 * 9 / 11, 'SHUNT R3': 600 * 20 / 99 }],
  ['pads', 'tpad', { atten: 6.020599913279624, z: 600 }, { 'SERIES ARMS R1 = R2': 200, 'SHUNT R3': 800 }],
  ['pads', 'pipad', { atten: 20, z: 600 }, { 'SERIES R': 600 * 99 / 20, 'EACH SHUNT R (×2)': 600 * 11 / 9 }],
  ['pads', 'pipad', { atten: 6.020599913279624, z: 600 }, { 'SERIES R': 450, 'EACH SHUNT R (×2)': 1800 }],
  // ── vdrop (copper at the conductor temperature)
  ['vdrop', 'drop', { awg: 16, len: 30, current: 3, vsrc: 48, condTemp: 75 }, { 'ROUND-TRIP RESISTANCE': 60 * rhoCu(75) / awgA(16), 'VOLTAGE DROP': 180 * rhoCu(75) / awgA(16) }],
  ['vdrop', 'drop', { awg: 18, len: 100, current: 50, vsrc: 12, condTemp: 20 }, 'R'],
  ['vdrop', 'gaugeFor', { len: 30, current: 20, vsrc: 120, pct: 3, condTemp: 75 }, { 'REQUIRED AREA (mm²)': rhoCu(75) * 60 * 20 / 3.6 * 1e6, 'DROP-LIMITED AWG (CHECK AMPACITY)': Math.floor(awgFromA(rhoCu(75) * 60 * 20 / 3.6)) }],
  ['vdrop', 'gaugeFor', { len: 1, current: 0.001, vsrc: 48, pct: 3, condTemp: 20 }, 'T:Any gauge up to 40 AWG'],
  // ── rackheat
  ['rackheat', 'heatLoad', { watts: 800, mains: 120, dTempF: 10 }, { 'MAINS CURRENT': 800 / 120, 'HEAT OUTPUT (BTU/hr)': 800 * BTU, 'COOLING AIRFLOW (CFM)': 800 * BTU / 10.8 }],
  ['rackheat', 'heatLoad', { watts: 1, mains: 230, dTempF: 1 }, { 'HEAT OUTPUT (BTU/hr)': BTU }],
  ['rackheat', 'safeLoad', { breaker: 15, mains: 120 }, { 'SAFE CONTINUOUS POWER (80%)': 1440, 'ABSOLUTE MAX POWER': 1800 }],
  ['rackheat', 'safeLoad', { breaker: 20, mains: 230 }, { 'SAFE CONTINUOUS CURRENT': 16 }],
  // ── complexz
  ['complexz', 'impedance', { r: 8, indmH: 1, capuF: 10, f: 1000 }, { 'IMPEDANCE MAGNITUDE |Z|': sq(64 + pw(2 * PI - 1 / (2 * PI * 1000 * 1e-5), 2)), 'PHASE ANGLE': Math.atan2(2 * PI - 1 / (2 * PI * 0.01), 8) * 180 / PI }],
  ['complexz', 'impedance', { r: 0, indmH: 1, capuF: 1, f: 1 / (2 * PI * sq(1e-9)) }, { 'IMPEDANCE MAGNITUDE |Z|': 0 }],
  ['complexz', 'resonance', { indmH: 1, capuF: 10 }, { 'RESONANT FREQUENCY': 1 / (2 * PI * sq(1e-8)) }],
  ['complexz', 'resonance', { indmH: 1000, capuF: 1e6 }, { 'RESONANT FREQUENCY': 1 / (2 * PI) }],
  // ── crossover
  ['crossover', 'firstOrder', { fx: 2500, z: 8 }, { 'CAPACITOR (µF) — high-pass': 1e6 / (2 * PI * 2500 * 8), 'INDUCTOR (mH) — low-pass': 1e3 * 8 / (2 * PI * 2500) }],
  ['crossover', 'firstOrder', { fx: 1 / (2 * PI), z: 1 }, { 'CAPACITOR (µF) — high-pass': 1e6 }],
  ['crossover', 'secondOrder', { fx: 2500, z: 8 }, { 'CAPACITOR (µF)': 1e6 / (2 * PI * Math.SQRT2 * 2500 * 8), 'INDUCTOR (mH)': 1e3 * Math.SQRT2 * 8 / (2 * PI * 2500) }],
  ['crossover', 'secondOrder', { fx: 80, z: 4 }, { 'INDUCTOR (mH)': 1e3 * Math.SQRT2 * 4 / (2 * PI * 80) }],
  // ── linearray
  ['linearray', 'directivity', { arrayLen: 2, temp: 20 }, { 'DIRECTIVITY ONSET (L = λ)': c20 / 2, 'TIGHT CONTROL ABOVE (L = 2λ)': c20 }],
  ['linearray', 'directivity', { arrayLen: 20, temp: 0 }, { 'DIRECTIVITY ONSET (L = λ)': c0 / 20 }],
  ['linearray', 'aliasing', { spacing: 0.25, temp: 20 }, { 'ALIASING (LOBING) FREQUENCY': c20 / 0.25 }],
  ['linearray', 'aliasing', { spacing: 0.01, temp: 20 }, { 'HALF-WAVELENGTH LIMIT (cleanest)': c20 / 0.02 }],
  ['linearray', 'distanceLoss', { splRef: 100, refDist: 4, farDist: 16 }, { 'SPL — POINT SOURCE': 100 - 20 * L10(4), 'SPL — LINE SOURCE (near field)': 100 - 10 * L10(4) }],
  ['linearray', 'distanceLoss', { splRef: 100, refDist: 4, farDist: 4 }, { 'LINE-SOURCE ADVANTAGE': 0 }],
  // ── driver
  ['driver', 'excursionSPL', { sd: 0.05, xmax: 0.005, f: 40, dist: 1 }, { 'MAX SPL AT DISTANCE': 20 * L10(RHOA * 2 * PI * 1600 * 0.05 * (0.005 / Math.SQRT2) / PREF) }],
  ['driver', 'excursionSPL', { sd: 0.05, xmax: 0.005, f: 40, dist: 0.05 }, 'R'],
  ['driver', 'sealed', { fs: 25, qts: 0.4, vas: 0.05, vb: 0.03 }, { 'SYSTEM RESONANCE fc': 25 * sq(1 + 5 / 3), 'SYSTEM Q (Qtc)': 0.4 * sq(1 + 5 / 3) }],
  ['driver', 'sealed', { fs: 25, qts: 0.4, vas: 0.05, vb: 1e9 }, { 'SYSTEM RESONANCE fc': 25 * sq(1 + 5e-11) }],
  ['driver', 'portLength', { fbTarget: 35, av: 0.005, vb: 0.03, temp: 20 }, { 'PHYSICAL PORT LENGTH': c20 * c20 * 0.005 / (pw(2 * PI * 35, 2) * 0.03) - 1.46 * sq(0.005 / PI) }],
  ['driver', 'portLength', { fbTarget: 500, av: 0.005, vb: 0.03, temp: 20 }, 'R'],
  // ── clockdrift
  ['clockdrift', 'slip', { sr: 48000, ppm: 50, dur: 3600 }, { 'SAMPLES SLIPPED': 8640, 'TIME ERROR': 0.18 }],
  ['clockdrift', 'slip', { sr: 48000, ppm: 1, dur: 1 }, { 'SAMPLES SLIPPED': 0.048 }],
  ['clockdrift', 'untilSlip', { sr: 48000, ppm: 50, maxSlip: 1 }, { 'TIME TO REACH SLIP BUDGET': 1 / 2.4 }],
  ['clockdrift', 'untilSlip', { sr: 192000, ppm: 0.1, maxSlip: 1000 }, { 'TIME TO REACH SLIP BUDGET': 1000 / 0.0192 }],
  // ── netaudio
  ['netaudio', 'bandwidth', { channels: 64, sr: 48000, bitdepth: 24 }, { 'RAW DATA RATE': 73728000 }],
  ['netaudio', 'bandwidth', { channels: 1, sr: 8000, bitdepth: 8 }, { 'RAW DATA RATE': 64000 }],
  ['netaudio', 'packetize', { channels: 64, sr: 48000, bitdepth: 24, packetms: 0.001 }, { 'PAYLOAD PER PACKET': 9216, 'ON-THE-WIRE RATE': 1000 * (9216 + 78) * 8 }],
  ['netaudio', 'packetize', { channels: 2, sr: 48000, bitdepth: 24, packetms: 0.000125 }, { 'ON-THE-WIRE RATE': 8000 * (36 + 78) * 8 }],
  // ── timecode
  ['timecode', 'fromFrames', { frames: 9000, fps: 25 }, { 'TOTAL TIME': 360 }],
  ['timecode', 'fromFrames', { frames: 0, fps: 29.97 }, { 'TOTAL TIME': 0 }],
  ['timecode', 'toFrames', { hours: 0, mins: 5, secs: 0, fps: 29.97 }, { 'TOTAL FRAMES': 9000, 'REAL ELAPSED TIME': 9000 / 29.97 }],
  ['timecode', 'toFrames', { hours: 1, mins: 0, secs: 0, fps: 24 }, { 'TOTAL FRAMES': 86400 }],
  ['timecode', 'pulldown', { dur: 3600 }, { 'PULLDOWN OFFSET': 3.6 }],
  ['timecode', 'pulldown', { dur: 1 }, { 'PULLDOWN OFFSET': 0.001 }],
  // ── firlen
  ['firlen', 'sizeTaps', { sr: 48000, trans: 100, atten: 60 }, { 'FILTER TAPS (N)': 1310, 'LATENCY IN SAMPLES': 654.5 }],
  ['firlen', 'sizeTaps', { sr: 48000, trans: 24000, atten: 60 }, 'R'],
  ['firlen', 'latency', { sr: 48000, taps: 1025 }, { 'LATENCY IN SAMPLES': 512, LATENCY: 512 / 48000 }],
  ['firlen', 'latency', { sr: 48000, taps: 1 }, { 'LATENCY IN SAMPLES': 0 }],
  // ── convolution
  ['convolution', 'cost', { irSec: 2, sr: 48000, channels: 2 }, { 'IR LENGTH IN TAPS': 96000, 'DIRECT-FORM LOAD (GMAC/s)': 9.216, 'IR MEMORY (32-bit float)': 768000 }],
  ['convolution', 'cost', { irSec: 0, sr: 48000, channels: 2 }, { 'IR LENGTH IN TAPS': 0 }],
  ['convolution', 'blockLatency', { block: 512, sr: 48000 }, { 'BLOCK LATENCY': 512 / 48000 }],
  ['convolution', 'blockLatency', { block: 1, sr: 48000 }, { 'ROUND-TRIP (2× BLOCK)': 2 / 48000 }],
  // ── bitdepth
  ['bitdepth', 'fromBits', { bits: 16 }, { 'THEORETICAL SNR (full-scale sine)': 16 * DBB + FS, 'DYNAMIC RANGE': 16 * DBB, 'SNR WITH TPDF DITHER': 16 * DBB + FS - 10 * L10(3), 'QUANTIZATION LEVELS 2^N': 65536 }],
  ['bitdepth', 'fromBits', { bits: 1 }, { 'QUANTIZATION LEVELS 2^N': 2, 'DYNAMIC RANGE': DBB }],
  ['bitdepth', 'bitsFromRange', { dr: 96 }, { 'BITS NEEDED (rounded up)': 16 }],
  ['bitdepth', 'bitsFromRange', { dr: 16 * DBB }, { 'BITS NEEDED (rounded up)': 16 }],
  // ── stereomic
  ['stereomic', 'pathDelay', { spacing: 0.4, angle: 30, temp: 20 }, { 'PATH DIFFERENCE': 0.2, 'ARRIVAL DELAY Δt': 0.2 / c20, 'FIRST MONO COMB NULL': c20 / 0.4 }],
  ['stereomic', 'pathDelay', { spacing: 0.4, angle: 0, temp: 20 }, 'R'],
  ['stereomic', 'threeToOne', { micDist: 0.3 }, { 'MINIMUM MIC SPACING': 0.9, 'BLEED LEVEL AT THAT SPACING': -20 * L10(3) }],
  ['stereomic', 'threeToOne', { micDist: 0 }, { 'MINIMUM MIC SPACING': 0 }],
  // ── micsens
  ['micsens', 'mvToDb', { mvpa: 15 }, { 'SENSITIVITY (dBV/Pa)': 20 * L10(0.015) }],
  ['micsens', 'mvToDb', { mvpa: 1000 }, { 'SENSITIVITY (dBV/Pa)': 0 }],
  ['micsens', 'dbToMv', { dbvpa: -36.5 }, { 'SENSITIVITY (mV/Pa)': 1000 * pw(10, -36.5 / 20) }],
  ['micsens', 'dbToMv', { dbvpa: 0 }, { 'SENSITIVITY (mV/Pa)': 1000 }],
  ['micsens', 'outputAtSPL', { mvpa: 15, spl: 114 }, { 'OUTPUT VOLTAGE': 0.015 * PREF * pw(10, 5.7) }],
  ['micsens', 'outputAtSPL', { mvpa: 1000, spl: 20 * L10(1 / PREF) }, { 'OUTPUT VOLTAGE': 1, 'OUTPUT LEVEL (dBV)': 0 }],
  // ── rflink
  ['rflink', 'pathLoss', { dist: 50, freqMHz: 550 }, { 'FREE-SPACE PATH LOSS': 20 * L10(4 * PI * 50 * 550e6 / 299792458) }],
  ['rflink', 'pathLoss', { dist: 0.01, freqMHz: 550 }, 'R'],
  ['rflink', 'budget', { ptx: 10, gtx: 2, grx: 2, dist: 50, freqMHz: 550, rxsens: -95 }, { 'LINK MARGIN': 14 - 20 * L10(4 * PI * 50 * 550e6 / 299792458) + 95 }],
  ['rflink', 'budget', { ptx: 10, gtx: 0, grx: 0, dist: 1000, freqMHz: 100, rxsens: -95 }, { 'PATH LOSS': 20 * L10(1000) + 20 * L10(1e8) - K_FSPL }],
  // ── loudnorm
  ['loudnorm', 'normalize', { measured: -9, target: -14, truePeak: -0.5, ceiling: -1 }, { 'GAIN CHANGE': -5, 'RESULTING TRUE PEAK (dBTP)': -5.5, 'HEADROOM TO CEILING': 4.5 }],
  ['loudnorm', 'normalize', { measured: -20, target: -14, truePeak: -3, ceiling: -1 }, { 'OVER CEILING BY': 4 }],
  // ── loudtp
  ['loudtp', 'windows', { sr: 48000 }, { 'MOMENTARY WINDOW (400 ms)': 19200, 'SHORT-TERM WINDOW (3 s)': 144000 }],
  ['loudtp', 'windows', { sr: 44100 }, { 'BLOCK STEP (75% overlap)': 4410 }],
  ['loudtp', 'loudnessDelta', { lufsA: -14, lufsB: -20 }, { 'DIFFERENCE (LU)': 6, 'PERCEIVED LOUDNESS RATIO': pw(2, 0.6) }],
  ['loudtp', 'loudnessDelta', { lufsA: -24, lufsB: -14 }, { 'PERCEIVED LOUDNESS RATIO': 2 }],
  ['loudtp', 'truePeakMargin', { samplePeak: -0.1, lossy: 0 }, { 'RECOMMENDED CEILING (dBTP)': -1, 'OVER CEILING BY': 0.9 }],
  ['loudtp', 'truePeakMargin', { samplePeak: -3, lossy: 1 }, { 'RECOMMENDED CEILING (dBTP)': -2, 'MARGIN TO CEILING': 1 }],
  // ── align
  ['align', 'delayForOffset', { offset: 1.2, temp: 20, sr: 48000 }, { 'DELAY TO ALIGN': 1.2 / c20, 'DELAY IN SAMPLES': 1.2 * 48000 / c20 }],
  ['align', 'delayForOffset', { offset: 0, temp: 20, sr: 48000 }, { 'DELAY TO ALIGN': 0 }],
  ['align', 'phaseAtFreq', { offset: 1.2, freq: 80, temp: 20 }, { 'PHASE OFFSET': 360 * 1.2 * 80 / c20 }],
  ['align', 'phaseAtFreq', { offset: c20 / 80, freq: 80, temp: 20 }, { 'PHASE OFFSET': 0, 'OFFSET IN WAVELENGTHS': 1 }],
  ['align', 'distanceForDelay', { delay: 0.0035, temp: 20 }, { 'PATH DISTANCE': 0.0035 * c20 }],
  ['align', 'distanceForDelay', { delay: 0, temp: 20 }, { 'PATH DISTANCE': 0 }],
  // ── imd
  ['imd', 'products', { f1: 19000, f2: 20000 }, { '2ND-ORDER DIFFERENCE (f₂−f₁)': 1000, '3RD-ORDER LOWER (2·lower − higher)': 18000, '3RD-ORDER UPPER (2·higher − lower)': 21000 }],
  ['imd', 'products', { f1: 1000, f2: 3000 }, { '3RD-ORDER LOWER (2·lower − higher)': 1000, '2ND-ORDER SUM (f₁+f₂)': 4000 }],
];

type Out = { label: string; value?: number; text?: string; refusal?: true; quantity?: string };
type Fn = {
  key: string;
  inputs: string[];
  formula: string;
  explain: string;
  compute: (v: Record<string, unknown>) => Out[];
  steps?: (v: Record<string, unknown>) => string[];
  table?: (v: Record<string, unknown>) => { rows: string[][] };
};
type Ws = { id: string; warnings?: string; example: string; mistakes: string[]; fields: { key: string; range?: readonly [number, number]; warn?: { test: (x: number) => boolean; msg: string } }[]; functions: Fn[] };
const WS = WORKSPACES as unknown as Ws[];
const ws = (id: string) => WS.find((w) => w.id === id)!;
const fn = (w: string, k: string) => ws(w).functions.find((f) => f.key === k)!;
const outs = (w: string, k: string, v: Record<string, unknown>) => fn(w, k).compute(v);
const num = (o: Out[], label: string) => {
  const r = o.find((x) => x.label === label);
  assert.ok(r && typeof r.value === 'number', `no numeric row "${label}" in ${JSON.stringify(o.map((x) => x.label))}`);
  return r.value!;
};
const close = (a: number, b: number, rel = 1e-9) => assert.ok(Math.abs(a - b) <= Math.max(rel * Math.abs(b), 1e-12), `${a} ≠ ${b}`);
const refused = (o: Out[]) => o.some((x) => x.refusal === true);

// ───────────────────────────── the full vector table ─────────────────────────
describe('AUDIT — two independent hand-computed vectors for EVERY calculator function', () => {
  it('every function has at least two vectors', () => {
    const count = new Map<string, number>();
    for (const [w, k] of V) count.set(`${w}.${k}`, (count.get(`${w}.${k}`) ?? 0) + 1);
    const under = WS.flatMap((w) => w.functions.map((f) => `${w.id}.${f.key}`)).filter((k) => (count.get(k) ?? 0) < 2);
    assert.deepEqual(under, []);
  });
  for (const [w, k, v, exp] of V) {
    it(`${w}.${k} ${JSON.stringify(v)}`, () => {
      const f = fn(w, k);
      let o: Out[] | null = null;
      let threw = false;
      try {
        o = f.compute(v);
        f.steps?.(v);
        f.table?.(v);
      } catch {
        threw = true;
      }
      const nums = (o ?? []).filter((x) => 'value' in x);
      const isErr = threw || (nums.length > 0 && nums.every((x) => !Number.isFinite(x.value)));
      if (exp === 'E') return assert.ok(isErr, 'expected the "no valid result" state');
      assert.ok(!isErr, 'unexpected error');
      if (exp === 'R') return assert.ok(refused(o!), `expected a refusal: ${JSON.stringify(o)}`);
      if (typeof exp === 'string') {
        const needle = exp.slice(2);
        return assert.ok(o!.some((x) => (x.text ?? '').includes(needle) || x.label.includes(needle)), `"${needle}" not in ${JSON.stringify(o)}`);
      }
      assert.ok(!refused(o!), `unexpected refusal: ${JSON.stringify(o)}`);
      for (const [label, want] of Object.entries(exp)) close(num(o!, label), want);
    });
  }
});

// ─────────────────────────────── per-fix receipts ────────────────────────────
describe('A1 — Voltage Drop costs copper at the conductor temperature (was 20 °C only)', () => {
  const v = { awg: 16, len: 30, current: 3, vsrc: 48, condTemp: 75 };
  it('has a CONDUCTOR TEMPERATURE input, ranged, on both functions', () => {
    const f = ws('vdrop').fields.find((x) => x.key === 'condTemp');
    assert.ok(f, 'condTemp field');
    assert.deepEqual(f!.range, [-40, 150]);
    assert.ok(fn('vdrop', 'drop').inputs.includes('condTemp'));
    assert.ok(fn('vdrop', 'gaugeFor').inputs.includes('condTemp'));
  });
  it('30 m of 16 AWG at 3 A, 75 °C: 0.9613 Ω and 2.884 V — 21.6% above the 20 °C figure', () => {
    const o = outs('vdrop', 'drop', v);
    close(num(o, 'ROUND-TRIP RESISTANCE'), 0.9613282753314104, 1e-9);
    close(num(o, 'VOLTAGE DROP'), 2.883984825994231, 1e-9);
    const cold = num(outs('vdrop', 'drop', { ...v, condTemp: 20 }), 'VOLTAGE DROP');
    close(num(o, 'VOLTAGE DROP') / cold, 1 + 0.00393 * 55, 1e-12);
  });
  it('the steps show the resistivity at that temperature', () => {
    const s = fn('vdrop', 'drop').steps!(v).join(' ');
    assert.match(s, /ρ at 75 °C/);
    assert.doesNotMatch(s, /1\.724e-8 ×/);
  });
  it('the reverse sizes for the hot conductor too (more copper)', () => {
    const g = { len: 30, current: 20, vsrc: 120, pct: 3 };
    assert.ok(num(outs('vdrop', 'gaugeFor', { ...g, condTemp: 90 }), 'REQUIRED AREA (mm²)') > num(outs('vdrop', 'gaugeFor', { ...g, condTemp: 20 }), 'REQUIRED AREA (mm²)'));
  });
  it('a gauge finer than 40 AWG is never printed (was "92 AWG")', () => {
    const o = outs('vdrop', 'gaugeFor', { len: 1, current: 0.001, vsrc: 48, pct: 3, condTemp: 20 });
    const row = o.find((x) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)')!;
    assert.equal(row.value, undefined);
    assert.match(row.text ?? '', /Any gauge up to 40 AWG/);
    assert.doesNotMatch(fn('vdrop', 'gaugeFor').steps!({ len: 1, current: 0.001, vsrc: 48, pct: 3, condTemp: 20 }).join(' '), /\b\d{2,3} AWG or thicker/);
  });
});

describe('A2 — one copper model: Speaker Cable Loss and Voltage Drop agree about the same wire', () => {
  it('16 AWG over 30 m at 20 °C: the same round-trip resistance in both', () => {
    const cable = num(outs('cable', 'loss', { len: 30, awg: 16, z: 8, pamp: 500 }), 'LOOP RESISTANCE (16 AWG)');
    const vdrop = num(outs('vdrop', 'drop', { awg: 16, len: 30, current: 1, vsrc: 48, condTemp: 20 }), 'ROUND-TRIP RESISTANCE');
    close(cable, vdrop, 1e-12); // was 0.7908 (table 0.01318 Ω/m) vs 0.7905
  });
  it('10 AWG is 0.003277 Ω/m, not the hand-typed 0.00328', () => {
    close(num(outs('cable', 'loss', { len: 0.5, awg: 10, z: 8, pamp: 100 }), 'LOOP RESISTANCE (10 AWG)'), 1 / 58e6 / (Math.PI * (0.127e-3 * Math.pow(92, 26 / 39)) ** 2 / 4), 1e-12);
  });
});

describe('A3 — Rack heat uses 1 W = 3.41214 BTU/hr (was 3.412)', () => {
  it('800 W → 2729.71 BTU/hr', () => {
    close(num(outs('rackheat', 'heatLoad', { watts: 800, mains: 120, dTempF: 10 }), 'HEAT OUTPUT (BTU/hr)'), 800 * 3.4121416331279, 1e-10);
  });
});

describe('A4 — single-level allowable time below the counting threshold says "no limit"', () => {
  it('NIOSH, 70 dBA: no "256 hours" — words, no number', () => {
    const o = outs('dose', 'allowNiosh', { lex: 70 });
    assert.ok(o.every((x) => !('value' in x)), JSON.stringify(o));
    assert.match(o[0].text ?? '', /No limit: NIOSH counts no sound below 80 dBA/);
  });
  it('OSHA, 75 dBA: no "128 hours"; 85 dBA: the time, and it says action level only', () => {
    const lo = outs('dose', 'allowOsha', { lex: 75 });
    assert.ok(lo.every((x) => !('value' in x)));
    assert.match(lo[0].text ?? '', /No limit: OSHA counts no sound below 80 dBA/);
    const mid = outs('dose', 'allowOsha', { lex: 85 });
    close(num(mid, 'ALLOWABLE TIME (90 dBA / 5 dB / 8 h)'), 960 * 60);
    assert.match(mid.find((x) => x.label === 'WHICH DOSE')?.text ?? '', /ACTION-LEVEL dose only/);
    assert.equal(outs('dose', 'allowOsha', { lex: 95 }).find((x) => x.label === 'WHICH DOSE'), undefined);
  });
  it('at exactly 80 dBA the time is given (the threshold is inclusive)', () => {
    close(num(outs('dose', 'allowNiosh', { lex: 80 }), 'ALLOWABLE TIME (85 dBA / 3 dB / 8 h)'), 480 * Math.pow(2, 5 / 3) * 60);
  });
  it('NIOSH’s 140 is named as the PEAK limit it is', () => {
    const t = outs('dose', 'allowNiosh', { lex: 141 }).find((x) => x.label === 'ABOVE 140 dBA')?.text ?? '';
    assert.match(t, /140 dB peak/);
    assert.doesNotMatch(t, /no exposure above 140 dBA at all/);
  });
});

describe('A5 — Critical distance uses the exact √(0.161/16π) = 0.0566 (was 0.057)', () => {
  it('300 m³, 0.8 s, Q 1 → 1.0960 m (was 1.1038)', () => {
    close(num(outs('critdist', 'dc', { vol: 300, rt60: 0.8, q: 1 }), 'CRITICAL DISTANCE Dc'), Math.sqrt((0.161 * 300) / (0.8 * 16 * Math.PI)));
    assert.match(fn('critdist', 'dc').formula, /0\.0566/);
  });
});

describe('A6 — Sabine from a surface list says when the room is too dead for Sabine', () => {
  it('ā = 0.5 over the listed surfaces → SABINE LIMIT with the Eyring figure', () => {
    const o = outs('sabine', 'rtFromSurfaces', { vol: 100, surfaces: [100], coeffs: [0.5] });
    const t = o.find((x) => x.label === 'SABINE LIMIT')?.text ?? '';
    assert.match(t, /average α = 0\.5/);
    assert.match(t, new RegExp(`Eyring gives ${((0.161 * 100) / (-100 * Math.log(0.5))).toPrecision(4)} s`));
  });
  it('ā = 0.25 → no limit row', () => {
    assert.equal(outs('sabine', 'rtFromSurfaces', { vol: 100, surfaces: [100], coeffs: [0.25] }).find((x) => x.label === 'SABINE LIMIT'), undefined);
  });
  it('the warnings name air absorption as left out', () => assert.match(ws('sabine').warnings ?? '', /air absorption/));
});

describe('A7 — panel absorber: f₀ = (c/2π)·√(ρ₀/(m·d)) = 59.94/√(m·d) (was 60)', () => {
  it('5 kg/m² over 5 cm → 119.88 Hz', () => {
    const rho = 101325 / (287.05 * 293.15);
    const c = 331.3 * Math.sqrt(1 + 20 / 273.15);
    close(num(outs('absorber', 'panel', { mass: 5, gap: 0.05 }), 'RESONANT FREQUENCY'), (c / (2 * Math.PI)) * Math.sqrt(rho / 0.25));
  });
});

describe('A8 — crossover constants at full precision', () => {
  it('first order 2.5 kHz / 8 Ω: C = 1/(2π·f·R) exactly', () => {
    close(num(outs('crossover', 'firstOrder', { fx: 2500, z: 8 }), 'CAPACITOR (µF) — high-pass'), 1e6 / (2 * Math.PI * 2500 * 8), 1e-13);
  });
  it('second-order Butterworth: L = √2·R/(2π·f) exactly', () => {
    close(num(outs('crossover', 'secondOrder', { fx: 2500, z: 8 }), 'INDUCTOR (mH)'), (1e3 * Math.SQRT2 * 8) / (2 * Math.PI * 2500), 1e-13);
  });
});

describe('A9 — driver excursion: ρ₀ = 1.204, and the near field is refused', () => {
  it('0.05 m², 5 mm, 40 Hz, 1 m → 100.59 dB SPL (ρ₀ 1.2041, was 1.2 → 100.56)', () => {
    const p = ((101325 / (287.05 * 293.15)) * 2 * Math.PI * 1600 * 0.05 * (0.005 / Math.SQRT2)) / 1;
    close(num(outs('driver', 'excursionSPL', { sd: 0.05, xmax: 0.005, f: 40, dist: 1 }), 'MAX SPL AT DISTANCE'), 20 * Math.log10(p / 2e-5));
  });
  it('5 cm from a 0.05 m² cone is inside its near field — refused in words, no number', () => {
    const o = outs('driver', 'excursionSPL', { sd: 0.05, xmax: 0.005, f: 40, dist: 0.05 });
    assert.ok(refused(o));
    assert.ok(o.every((x) => !('value' in x)));
    assert.match(o[0].text ?? '', /near field/);
  });
});

describe('A10 — a long port is flagged as outside the lumped Helmholtz model', () => {
  it('fb 20 Hz, 0.02 m² port, 10 L box → MODEL LIMIT row', () => {
    const o = outs('driver', 'portLength', { fbTarget: 20, av: 0.02, vb: 0.01, temp: 20 });
    assert.match(o.find((x) => x.label === 'MODEL LIMIT')?.text ?? '', /λ\/12/);
  });
  it('the placeholder box (35 Hz, 0.005 m², 30 L) is not flagged', () => {
    assert.equal(outs('driver', 'portLength', { fbTarget: 35, av: 0.005, vb: 0.03, temp: 20 }).find((x) => x.label === 'MODEL LIMIT'), undefined);
  });
});

describe('A11 — bit depth: exact constants, and 6.02·N + 1.76 is NOT the dithered figure', () => {
  it('16 bits: SNR 98.09 dB, TPDF-dithered 93.32 dB', () => {
    const o = outs('bitdepth', 'fromBits', { bits: 16 });
    close(num(o, 'THEORETICAL SNR (full-scale sine)'), 16 * 20 * Math.log10(2) + 10 * Math.log10(1.5));
    close(num(o, 'SNR WITH TPDF DITHER'), 16 * 20 * Math.log10(2) + 10 * Math.log10(1.5) - 10 * Math.log10(3));
  });
  it('no text calls the 6.02·N + 1.76 figure the dithered ideal', () => {
    const w = ws('bitdepth');
    const all = [w.warnings ?? '', ...w.mistakes, ...w.functions.map((f) => f.explain), ...fn('bitdepth', 'fromBits').steps!({ bits: 16 })].join(' ');
    assert.doesNotMatch(all, /(?<!un)dithered ideal/);
    assert.doesNotMatch(all, /for a dithered full-scale sine/);
  });
});

describe('A12 — FIR: a transition band wider than half the sample rate is refused', () => {
  it('48 kHz with a 24 kHz transition → refusal, no taps', () => {
    const o = outs('firlen', 'sizeTaps', { sr: 48000, trans: 24000, atten: 60 });
    assert.ok(refused(o));
    assert.ok(o.every((x) => !('value' in x)));
  });
  it('the rule is named as an estimate', () => assert.match(ws('firlen').warnings ?? '', /ESTIMATE/));
});

describe('A13 — RF: Friis is refused inside one wavelength (it printed a path GAIN)', () => {
  it('1 cm at 550 MHz → refusal, not −12.7 dB', () => {
    for (const k of ['pathLoss', 'budget']) {
      const o = outs('rflink', k, { dist: 0.01, freqMHz: 550, ptx: 10, gtx: 2, grx: 2, rxsens: -95 });
      assert.ok(refused(o), k);
      assert.ok(o.every((x) => !('value' in x)), k);
    }
  });
  it('one wavelength out the path loss is the exact 20·log₁₀(4π) = 21.98 dB', () => {
    const lam = 299792458 / 550e6;
    close(num(outs('rflink', 'pathLoss', { dist: lam, freqMHz: 550 }), 'FREE-SPACE PATH LOSS'), 20 * Math.log10(4 * Math.PI), 1e-9);
  });
});

describe('A14 — round-trip latency: no made-up 50/50 split of the processing time', () => {
  it('INPUT BUFFER ALONE is the input buffer; the old ONE-WAY row is gone', () => {
    const o = outs('latency', 'roundTrip', { inBuf: 128, outBuf: 128, proc: 0.0015, sr: 48000 });
    close(num(o, 'INPUT BUFFER ALONE'), 128 / 48000);
    assert.equal(o.find((x) => x.label === 'ONE-WAY (INPUT SIDE)'), undefined);
  });
  it('a sample count in the steps is exact (65536, not 65540)', () => {
    assert.match(fn('latency', 'smpToMs').steps!({ smp: 65536, sr: 48000 }).join(' '), /65536 samples/);
  });
});

describe('A15 — compressor ratio for an unreachable target is refused IN WORDS', () => {
  it('a target below the threshold names why no ratio reaches it', () => {
    const o = outs('compressor', 'ratioForOut', { thr: -20, inLvl: -8, targetOut: -25 });
    assert.ok(refused(o));
    assert.match(o[0].text ?? '', /even an infinite ratio stops at the threshold/);
  });
});

describe('A16 — small wording accuracy', () => {
  it('the limiter step has its space back', () => {
    assert.match(fn('limiter', 'maxv').steps!({ pwr: 500, z: 8 }).join(' '), /0\.7746\) = 38\.2/);
  });
  it('a negative SPL is not "impossible"', () => {
    const w = ws('micsens').fields.find((x) => x.key === 'spl')!.warn!;
    assert.doesNotMatch(w.msg, /cannot be negative/);
  });
});
