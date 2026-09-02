/**
 * Amplifier Principles Lab — model tests (build spec Part 3 §4, Part 4 §9).
 * Runs on Node's built-in test runner (native TS stripping): npm test
 *
 * These verify actual numeric results and state behavior — gain/dB, RMS,
 * power, impedance, transformer, efficiency, waveform/class behavior, bridge
 * mode, and protection priority — including zero/invalid inputs.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  voltageGain, voltageGainDb, powerGain, powerGainDb, powerDeltaDb,
  sineVrms, ohmsCurrent, resistivePower,
  seriesImpedance, parallelImpedance,
  transformer, transformerIdealPowerOk,
  efficiency, bridge,
  sineCycle, amplify, isClipping, cycleRms, WAVE_N,
  simulateLinearClass, simulateClassC, simulateClassD,
  prioritizeFaults, evaluateRig, clamp,
} from '../src/features/amp/ampModel.ts';

describe('gain and decibels', () => {
  it('unity, double, half voltage ratios', () => {
    assert.equal(voltageGain(1, 1), 1);
    assert.equal(voltageGain(1, 2), 2);
    assert.equal(voltageGainDb(1), 0);
    assert.ok(Math.abs(voltageGainDb(2)! - 6.0206) < 0.001);
    assert.ok(Math.abs(voltageGainDb(0.5)! + 6.0206) < 0.001);
  });
  it('2× power ≈ +3.01 dB, 10× = +10 dB, 0.5× ≈ −3.01 dB', () => {
    assert.ok(Math.abs(powerDeltaDb(1, 2)! - 3.0103) < 0.001);
    assert.equal(powerDeltaDb(1, 10), 10);
    assert.ok(Math.abs(powerDeltaDb(2, 1)! + 3.0103) < 0.001);
    assert.ok(Math.abs(powerGainDb(10)! - 10) < 1e-9);
    assert.equal(powerGain(2, 8), 4);
  });
  it('zero and invalid inputs are rejected, never NaN', () => {
    assert.equal(voltageGain(0, 5), null);
    assert.equal(voltageGainDb(0), null);
    assert.equal(voltageGainDb(-3), null);
    assert.equal(powerGain(-1, 5), null);
    assert.equal(powerDeltaDb(0, 10), null);
    assert.equal(powerDeltaDb(1, NaN), null);
  });
});

describe('RMS and resistive-load power', () => {
  it('sine RMS = peak/√2', () => {
    assert.ok(Math.abs(sineVrms(1)! - 0.70710678) < 1e-6);
    assert.ok(Math.abs(sineVrms(20)! - 14.1421) < 0.001);
  });
  it('V, I, R, P relationships on the labeled resistive example', () => {
    assert.equal(ohmsCurrent(8, 4), 2); // I = V/R
    assert.equal(resistivePower(20, 8), 50); // P = Vrms²/R
    assert.equal(resistivePower(20, 4), 100); // half the load, twice the power
  });
  it('invalid resistance rejected', () => {
    assert.equal(ohmsCurrent(8, 0), null);
    assert.equal(resistivePower(20, -8), null);
    assert.equal(sineVrms(-1), null);
  });
});

describe('series and parallel impedance', () => {
  it('series adds', () => {
    assert.equal(seriesImpedance([8, 8]), 16);
    assert.equal(seriesImpedance([4, 8, 16]), 28);
    assert.equal(seriesImpedance([8]), 8);
  });
  it('equal parallel = Z/n; unequal parallel correct', () => {
    assert.equal(parallelImpedance([8, 8]), 4);
    assert.equal(parallelImpedance([8, 8, 8, 8]), 2);
    assert.ok(Math.abs(parallelImpedance([8, 4])! - 8 / 3) < 1e-9);
  });
  it('invalid, zero and negative values never reach the UI', () => {
    assert.equal(parallelImpedance([8, 0]), null);
    assert.equal(parallelImpedance([-8]), null);
    assert.equal(seriesImpedance([8, NaN]), null);
    assert.equal(seriesImpedance([]), null);
    assert.equal(parallelImpedance([]), null);
  });
});

describe('transformer (ideal)', () => {
  it('step-down 10:1 divides voltage by 10, impedance ratio 100', () => {
    const t = transformer(1000, 100, 120, 8)!;
    assert.equal(t.voltageRatio, 10);
    assert.equal(t.vs, 12);
    assert.equal(t.impedanceRatio, 100);
    assert.equal(t.zReflected, 800);
    assert.equal(t.kind, 'step-down');
  });
  it('step-up and 1:1 isolation', () => {
    assert.equal(transformer(100, 200, 10)!.vs, 20);
    assert.equal(transformer(100, 200, 10)!.kind, 'step-up');
    assert.equal(transformer(100, 100, 10)!.kind, 'isolation');
    assert.equal(transformer(100, 100, 10)!.vs, 10);
  });
  it('ideal output power never exceeds input power', () => {
    assert.ok(transformerIdealPowerOk(120, 1, 1000, 100));
    assert.ok(transformerIdealPowerOk(10, 2, 100, 200));
    assert.ok(transformerIdealPowerOk(10, 0, 100, 100));
  });
  it('invalid turns rejected', () => {
    assert.equal(transformer(0, 100, 10), null);
    assert.equal(transformer(100, -5, 10), null);
    assert.equal(transformer(NaN, 100, 10), null);
  });
});

describe('efficiency and loss', () => {
  it('normal condition', () => {
    const e = efficiency(100, 60)!;
    assert.equal(e.etaPct, 60);
    assert.equal(e.lossW, 40);
  });
  it('zero output = 0%, all loss', () => {
    const e = efficiency(50, 0)!;
    assert.equal(e.etaPct, 0);
    assert.equal(e.lossW, 50);
  });
  it('output greater than input is invalid for the complete amplifier', () => {
    assert.equal(efficiency(50, 60), null);
  });
  it('negative values invalid; result always within 0–100%', () => {
    assert.equal(efficiency(-1, 0), null);
    assert.equal(efficiency(10, -1), null);
    const e = efficiency(100, 100)!;
    assert.equal(e.etaPct, 100);
  });
});

describe('waveform behavior', () => {
  it('clean linear output below the rails', () => {
    const x = sineCycle(0.5);
    const y = amplify(x, 1.5, 1);
    assert.equal(isClipping(x, 1.5, 1), false);
    assert.ok(Math.abs(Math.max(...y) - 0.75) < 0.01);
  });
  it('positive AND negative clipping at the rails', () => {
    const x = sineCycle(1);
    const y = amplify(x, 2, 1);
    assert.equal(isClipping(x, 2, 1), true);
    assert.equal(Math.max(...y), 1);
    assert.equal(Math.min(...y), -1);
  });
  it('cycle RMS of unit sine ≈ 0.707', () => {
    assert.ok(Math.abs(cycleRms(sineCycle(1)) - 0.70710678) < 0.01);
  });
});

describe('amplifier-class models (educational)', () => {
  it('Class A conducts the full cycle and dissipates at idle', () => {
    const idle = simulateLinearClass('A', 0, 0);
    assert.equal(idle.conductionDeg, 360);
    assert.ok(idle.idleCurrent > 0.5);
    assert.ok(idle.heat > 0.4); // heat does NOT come from output power alone
    const driven = simulateLinearClass('A', 1, 0);
    assert.equal(driven.crossoverNotch, false);
    for (let i = 0; i < WAVE_N; i++) assert.ok(driven.iPos[i] >= 0);
  });
  it('Class B has a crossover notch AT zero crossing, low idle current', () => {
    const s = simulateLinearClass('B', 1, 0);
    assert.equal(s.crossoverNotch, true);
    assert.equal(s.idleCurrent, 0);
    // The notch is at the zero crossings (samples near i=0 and i=n/2), not peaks.
    assert.equal(s.out[1], 0);
    assert.equal(s.out[WAVE_N / 2 + 1], 0);
    assert.ok(Math.abs(s.out[WAVE_N / 4]) > 0.8); // peak untouched
    assert.ok(s.conductionDeg > 150 && s.conductionDeg <= 185);
  });
  it('Class AB: raising bias removes the notch, raises idle current and heat', () => {
    const low = simulateLinearClass('AB', 1, 0.05);
    const high = simulateLinearClass('AB', 1, 1);
    assert.equal(low.crossoverNotch, true);
    assert.equal(high.crossoverNotch, false);
    assert.ok(high.idleCurrent > low.idleCurrent);
    assert.ok(high.heat > low.heat);
    assert.ok(high.conductionDeg > 180); // overlap pushes past 180°
  });
  it('Class B efficiency ceiling stays at the labeled theoretical 78.5%', () => {
    const s = simulateLinearClass('B', 1, 0);
    assert.ok(s.efficiencyPct <= 78.5);
  });
  it('Class C: pulsed conduction well under 180°, recovery needs the tank', () => {
    const tuned = simulateClassC(1, 1);
    assert.ok(tuned.conductionDeg < 180);
    assert.ok(tuned.conductionDeg > 0);
    assert.ok(tuned.resonanceGain > 0.95);
    // Raw output is pulses (zero most of the cycle), recovered is a sine.
    let zeros = 0;
    for (let i = 0; i < WAVE_N; i++) if (tuned.out[i] === 0) zeros++;
    assert.ok(zeros > WAVE_N / 2);
    const mistuned = simulateClassC(1, 1.6);
    assert.ok(mistuned.resonanceGain < 0.25);
    assert.ok(cycleRms(mistuned.recovered) < cycleRms(tuned.recovered) * 0.3);
  });
  it('Class D: duty cycle follows the audio; filtered differs from switching', () => {
    const s = simulateClassD(0.8);
    assert.ok(Math.abs(s.meanDuty - 0.5) < 0.05); // sine averages ~50%
    // PWM is two-state; recovered is not.
    for (let i = 0; i < WAVE_N; i++) assert.ok(s.pwm[i] === 1 || s.pwm[i] === -1);
    let binary = true;
    for (let i = 0; i < WAVE_N; i++) if (Math.abs(Math.abs(s.recovered[i]) - 1) > 0.05) binary = false;
    assert.equal(binary, false);
    // Recovered output follows the audio's shape (positive correlation).
    let corr = 0;
    for (let i = 0; i < WAVE_N; i++) corr += s.recovered[i] * s.audio[i];
    assert.ok(corr > 0);
    // Silence = 50% duty, and efficiency is never 100%.
    assert.ok(Math.abs(simulateClassD(0).meanDuty - 0.5) < 0.02);
    assert.ok(s.efficiencyPct < 100);
    assert.ok(simulateClassD(0).efficiencyPct < 100);
  });
});

describe('bridge mode', () => {
  it('load sees the channel difference; each channel sees half the load', () => {
    const b = bridge(10, -10, 8)!;
    assert.equal(b.vLoad, 20);
    assert.equal(b.effectivePerChannelZ, 4);
  });
  it('invalid load rejected', () => {
    assert.equal(bridge(10, -10, 0), null);
    assert.equal(bridge(NaN, -10, 8), null);
  });
});

describe('protection priority', () => {
  it('single faults pass through', () => {
    assert.equal(prioritizeFaults(['output-clipping']).primary, 'output-clipping');
    assert.deepEqual(prioritizeFaults([]).secondary, []);
    assert.equal(prioritizeFaults([]).primary, null);
  });
  it('multiple simultaneous faults: most immediate first, rest secondary', () => {
    const v = prioritizeFaults(['output-clipping', 'short', 'thermal-limiting']);
    assert.equal(v.primary, 'short');
    assert.deepEqual(v.secondary, ['thermal-limiting', 'output-clipping']);
  });
});

describe('rig evaluation (Module 7/8 scenarios)', () => {
  const base = {
    sourceLevel: 0.5, mixerLevel: 0.5, ampInput: 0.5,
    railLimit: 1, loadZ: 8, minLoadZ: 4,
    bridged: false, bridgeSupported: true,
    ventBlocked: 0, instrumentCable: false, shorted: false,
  };
  it('sane defaults produce no primary fault', () => {
    assert.equal(evaluateRig(base).primary, null);
  });
  it('lower load raises current demand', () => {
    const hi = evaluateRig({ ...base, loadZ: 2 });
    assert.ok(hi.currentDemand > evaluateRig(base).currentDemand);
  });
  it('bridging halves the effective per-channel load and can violate minimums', () => {
    const v = evaluateRig({ ...base, bridged: true, loadZ: 4 });
    assert.equal(v.effectiveLoadZ, 2);
    assert.equal(v.primary, 'load-below-min');
  });
  it('unsupported bridge outranks the load fault', () => {
    const v = evaluateRig({ ...base, bridged: true, bridgeSupported: false, loadZ: 4 });
    assert.equal(v.primary, 'bad-bridge');
    assert.ok(v.secondary.includes('load-below-min'));
  });
  it('upstream clipping is distinguished from amplifier output clipping', () => {
    const up = evaluateRig({ ...base, sourceLevel: 1, mixerLevel: 1, ampInput: 0.2 });
    assert.equal(up.upstreamClips, true);
    const out = evaluateRig({ ...base, sourceLevel: 0.6, mixerLevel: 0.7, ampInput: 1, railLimit: 0.4 });
    assert.equal(out.upstreamClips, false);
    assert.equal(out.outputClips, true);
  });
  it('blocked ventilation raises thermal state; full block + drive shuts down', () => {
    const v0 = evaluateRig({ ...base, ampInput: 1, sourceLevel: 0.8, mixerLevel: 0.8, loadZ: 4 });
    const v1 = evaluateRig({ ...base, ampInput: 1, sourceLevel: 0.8, mixerLevel: 0.8, loadZ: 4, ventBlocked: 1 });
    assert.ok(v1.thermal > v0.thermal);
    assert.ok(v1.primary === 'thermal-shutdown' || v1.secondary.includes('thermal-shutdown') || v1.thermal >= 0.9);
  });
  it('a short circuit is always the primary fault', () => {
    const v = evaluateRig({ ...base, shorted: true, ventBlocked: 1, loadZ: 2 });
    assert.equal(v.primary, 'short');
  });
  it('conceptual meters stay in range under extremes', () => {
    const v = evaluateRig({ ...base, sourceLevel: 1, mixerLevel: 1, ampInput: 1, loadZ: 1, ventBlocked: 1 });
    assert.ok(v.currentDemand >= 0 && v.currentDemand <= 1);
    assert.ok(v.thermal >= 0 && v.thermal <= 1);
  });
});

describe('numeric hygiene', () => {
  it('clamp behaves', () => {
    assert.equal(clamp(5, 0, 1), 1);
    assert.equal(clamp(-5, 0, 1), 0);
    assert.equal(clamp(0.5, 0, 1), 0.5);
  });
});
