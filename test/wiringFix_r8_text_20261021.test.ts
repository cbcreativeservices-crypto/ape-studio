/**
 * Wiring fix round 8 (2026-10-21) — the R7 grader's text findings across the
 * Production, Digital, FX, Meter, Amplifier, Signal Chain, Gain, Calculator
 * and Modular labs. Each item is pinned so the old wording cannot come back.
 *
 *   S1  R7-PROD-01, R7-DIG-01, R7-FX-01, R7-MTR-01, R7-MTR-02
 *   S2  R7-FX-02, R7-MTR-03
 *   S3  R7-MTR-04..07, R7-DIG-02..04, R7-PROD-02..04, R7-AMP-01..03,
 *       R7-SC-01..03, R7-GN-01..02, R7-CALC-01..05, R7-FX-03..11, R7-MOD-01
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

const STAGE2 = read('src/features/production/postprod/stage2.data.ts');
const STAGE3 = read('src/features/production/postprod/stage3.data.ts');
const STAGE7 = read('src/features/production/postprod/stage7.data.ts');
const LOGIC2 = read('src/features/production/preprod/logic2.ts');
const DAC = read('src/screens/lab/digital/modules/modDac.tsx');
const QUANT = read('src/screens/lab/digital/modules/modQuant.tsx');
const CONTENT = read('src/features/lab/guidedLessons/content.ts');
const FX = read('src/screens/lab/fxLabConfigs.tsx');
const MB = read('src/screens/lab/meter/modules/modMeterB.tsx');
const MC = read('src/screens/lab/meter/modules/modMeterC.tsx');
const VIZM = read('src/screens/lab/meter/vizMeters.tsx');
const MREG = read('src/screens/lab/meter/modules/registry.ts');
const CAT = read('src/screens/lab/labCatalog.ts');
const AMPC = read('src/features/amp/ampContent.ts');
const SUPPLY = read('src/screens/lab/amp/modules/mod6Supply.tsx');
const AMPS = read('src/screens/lab/amp/AmpModuleScreen.tsx');
const GLEARN = read('src/screens/lab/gain/modules/modLearn.tsx');
const GEXP = read('src/screens/lab/gain/modules/modExplore.tsx');
const TP = read('src/screens/lab/calc/workspaces/timePhase.ts');
const SPKADV = read('src/screens/lab/calc/workspaces/speakersAdv.ts');
const PWR = read('src/screens/lab/calc/workspaces/powerElec.ts');
const WF = read('src/screens/lab/calc/workflowCatalog.ts');
const SPK = read('src/screens/lab/calc/workspaces/speakers.ts');
const CALCU = read('src/screens/lab/calc/calcUnits.ts');
const BIQUAD = read('modules/ape-dsp/ios/core/Biquad.hpp');
const EFFECTS = read('modules/ape-dsp/ios/core/Effects.hpp');

describe('S1', () => {
  it('R7-PROD-01: a wrong sample rate = wrong speed and pitch; free-running clocks cause the slow slide', () => {
    assert.match(STAGE2, /wrong speed and pitch/);
    assert.doesNotMatch(STAGE3, /different sample rate, which is the classic cause of a slow, steady slide/);
    assert.match(STAGE3, /plays at the wrong speed and pitch/);
    assert.match(STAGE3, /slow, steady slide that people blame on the performer comes from free-running clocks/);
  });

  it('R7-DIG-01: 6.02·N + 1.76 is called theoretical SNR (undithered) everywhere', () => {
    assert.doesNotMatch(QUANT, /'TH\. DR'/);
    assert.match(QUANT, /\{ k: 'TH\. SNR',/);
    assert.match(QUANT, /THEORETICAL SNR \(6\.02·N \+ 1\.76 dB, undithered\)/);
    assert.doesNotMatch(QUANT, /THEORETICAL dynamic range/);
    assert.match(DAC, /noise floor and theoretical SNR \(≈ 6\.02·N \+ 1\.76 dB, undithered\)/);
    assert.match(DAC, /theoretical SNR for an UNDITHERED full-scale sine/);
    assert.match(CONTENT, /amplitude resolution and theoretical SNR \(≈ 6\.02·N \+ 1\.76 dB, undithered\)/);
    assert.match(CONTENT, /SNR ≈ 6\.02·N \+ 1\.76 dB \(theoretical, undithered\)/);
    assert.doesNotMatch(CONTENT, /DR ≈ 6\.02·N/);
  });

  it('R7-FX-01: Q is ignored by the high-pass only; on the low-pass Q shapes the corner (engine agrees)', () => {
    assert.match(EFFECTS, /case LowPass: bq = Biquad::lowpass\(f, q, fs_\)/);
    assert.match(EFFECTS, /case HighPass: bq = Biquad::highpass\(f, fs_\)/);
    assert.doesNotMatch(FX, /GAIN and Q don't apply to a pass filter/);
    assert.doesNotMatch(FX, /GAIN and Q belong to bells and shelves/);
    assert.match(FX, /GAIN and Q don't apply to the high-pass/);
    assert.match(FX, /on the low-pass Q shapes the corner/);
    assert.match(FX, /On the low-pass, Q shapes the corner; on the high-pass it does nothing/);
  });

  it('R7-MTR-01: the Z-axis check matches the drawing (t = 0 at the back, time steps toward you)', () => {
    assert.match(MB, /\(t = 0\) stands tall at the BACK/); // the drawing's own axis text
    assert.doesNotMatch(MB, /The front edge is "now"/);
    assert.doesNotMatch(MB, /Z = time receding/);
    assert.doesNotMatch(MB, /each ridge behind the front/);
    assert.match(MB, /Z = time stepping toward you\. The back edge is the start \(t = 0\)/);
    assert.match(MB, /'TIME — each ridge nearer the front is the spectrum a moment later'/);
  });

  it('R7-MTR-02: the Detective waterfall case uses the same orientation', () => {
    assert.doesNotMatch(MC, /TIME receding into the picture/);
    assert.doesNotMatch(MC, /collapsing toward the back/);
    assert.doesNotMatch(MC, /how far back into TIME/);
    assert.match(MC, /TIME stepping toward you — the start \(t = 0\) stands at the back/);
    assert.match(MC, /keeps standing all the way toward the front/);
  });
});

describe('S2', () => {
  it('R7-FX-02: attack is a time constant — how fast it clamps, not a wait', () => {
    assert.doesNotMatch(FX, /waits before clamping/);
    assert.doesNotMatch(FX, /sneak through untouched/);
    assert.match(FX, /Attack sets how fast the compressor clamps — it is a time constant, not a wait/);
    assert.match(FX, /a 25 ms time constant/);
  });

  it('R7-MTR-03: the loudness line reads STREAMING ≈ −14 (varies), never one TARGET', () => {
    assert.doesNotMatch(VIZM, /`TARGET \$\{targetLufs/);
    assert.match(VIZM, /`STREAMING\\n≈ \$\{targetLufs < 0 \? '−' \+ Math\.abs\(targetLufs\) : targetLufs\} \(varies\)`/);
    // Two lines sit above the line, inside the bar column, at ≥ 9 pt.
    assert.match(VIZM, /y=\{yL\(targetLufs\) - 25 \* ts\} w=\{84\} align="left" size=\{9\}/);
  });
});

describe('S3 — meter', () => {
  it('R7-MTR-04: a ringing ridge stretches toward the FRONT', () => {
    assert.doesNotMatch(MB, /far behind the front/);
    assert.doesNotMatch(MB, /stretches far behind/);
    assert.doesNotMatch(MB, /LONGER or SHORTER into the picture/);
    assert.doesNotMatch(MB, /length into the picture is decay time/);
    assert.match(MB, /still standing tall far toward the front/);
    assert.match(MB, /250 Hz ridge stretches far toward the front/);
    assert.match(MB, /how far it reaches toward the front is decay time/);
    assert.match(CONTENT, /ridge stretches far toward the front while everything nearby has died/);
  });

  it('R7-MTR-05: the sample-peak face is labelled SAMPLE PEAK', () => {
    assert.doesNotMatch(VIZM, /PEAK PROGRAM/);
    assert.match(VIZM, />\s*SAMPLE PEAK\s*</);
  });

  it('R7-MTR-06: the phase module blurb says polarity', () => {
    assert.doesNotMatch(MREG, /in\/out of phase/);
    assert.match(MREG, /normal vs\. inverted polarity/);
  });

  it('R7-MTR-07: analog clipping OFTEN rounds', () => {
    assert.match(CONTENT, /Analog clipping often rounds; digital clipping shears\./);
  });
});

describe('S3 — digital', () => {
  it('R7-DIG-02: reclocking is hedged — the converter clock still jitters', () => {
    assert.doesNotMatch(CONTENT, /can remove it entirely/);
    assert.match(CONTENT, /converter’s own clock still has a little/);
    assert.doesNotMatch(DAC, /'HARMLESS AT'/);
    assert.match(DAC, /\{ k: 'REDUCED BY', v: 'buffered · reclocked playback' \}/);
  });

  it('R7-DIG-03: speech does not need 20 kHz bandwidth', () => {
    assert.doesNotMatch(DAC, /speech needs clean 20 kHz bandwidth/);
    assert.match(DAC, /speech stays clear with far less bandwidth than music/);
  });

  it('R7-DIG-04: transients are hedged, not "never"', () => {
    assert.doesNotMatch(CONTENT, /no transient ever reaches the cliff/);
    assert.match(CONTENT, /most transients stay well clear of the cliff/);
  });
});

describe('S3 — production', () => {
  it('R7-PROD-02: inter-sample peaks are already in the master; encoding raises them', () => {
    assert.doesNotMatch(STAGE7, /The difference appears after encoding/);
    assert.match(STAGE7, /Peaks between samples are already in the master, and encoding can push them higher/);
  });

  it('R7-PROD-03: backing off the limiting/compression gives the dynamics back, not gain', () => {
    assert.doesNotMatch(STAGE7, /The fix was gain, downward, which costs nothing and gives the dynamics back/);
    assert.match(STAGE7, /back off the limiting and compression — that is what gives the dynamics back/);
  });

  it('R7-PROD-04: a DI reaches the console on XLR only', () => {
    assert.doesNotMatch(LOGIC2, /\['xlr', 'trs'\]\.includes\(cell\(r, 'in_connection'\)\)/);
    assert.match(LOGIC2, /cell\(r, 'in_capture'\) === 'di' && cell\(r, 'in_connection'\) === 'xlr'/);
  });
});

describe('S3 — amplifier', () => {
  it('R7-AMP-01: a tube stage can be single-ended, not "also Class A"', () => {
    assert.doesNotMatch(AMPC, /A tube stage is also Class A/);
    assert.match(AMPC, /A tube stage can also be single-ended/);
  });

  it('R7-AMP-02: switch-mode supplies are OFTEN regulated', () => {
    assert.doesNotMatch(SUPPLY, /then rectified and regulated\./);
    assert.match(SUPPLY, /then rectified and often regulated/);
    assert.match(SUPPLY, /blurb: 'Often regulated:/);
  });

  it('R7-AMP-03: the lab plays no audio — no "any level it plays" clause', () => {
    assert.doesNotMatch(AMPS, /any level it plays/);
    assert.match(AMPS, /not bench measurements\. For real amplifier work/);
  });
});

describe('S3 — signal chain', () => {
  it('R7-SC-01: a hot EQ boost (not the compressor) makes the limiter work harder', () => {
    assert.doesNotMatch(CONTENT, /a hot compressor makes the limiter work harder/);
    assert.match(CONTENT, /a hot EQ boost makes the limiter work harder/);
  });

  it('R7-SC-02: one patch cable per hop', () => {
    assert.doesNotMatch(CONTENT, /nine rack units on one patch cable/);
    assert.match(CONTENT, /one patch cable for each hop from unit to unit/);
  });

  it('R7-SC-03: the catalog order lists every rack unit, STEREO included', () => {
    assert.match(CAT, /Generator → EQ → Comp → Gate → Dist → Mod → Delay → Reverb → Stereo → Limiter → Output\./);
    assert.doesNotMatch(CAT, /Gate → FX → Reverb/);
  });
});

describe('S3 — gain', () => {
  it('R7-GN-01: the distractor says polarity inverted', () => {
    assert.doesNotMatch(GLEARN, /'The signal is now out of phase'/);
    assert.match(GLEARN, /'The signal is now polarity inverted'/);
  });

  it('R7-GN-02: the FADER stage itself goes over (that is the stage that clips in this lab)', () => {
    assert.doesNotMatch(GEXP, /the gain stage right after it overloads/);
    assert.match(GEXP, /the FADER stage itself goes over its ceiling/);
  });
});

describe('S3 — calculator', () => {
  it('R7-CALC-01: the delay-tower example matches the calc (343.2 m/s → 87.4 ms → ≈ 4196 samples)', () => {
    assert.match(CALCU, /343\.2 m\/s at 20 °C/);
    assert.doesNotMatch(TP, /87\.5 ms/);
    assert.match(TP, /t = 30 ÷ 343\.2 ≈ 87\.4 ms/);
    assert.match(TP, /0\.08741 × 48000 ≈ 4196 samples/);
    const c = 331.3 * Math.sqrt(1 + 20 / 273.15);
    assert.equal((30 / c * 1000).toFixed(1), '87.4');
    assert.equal(Math.round(0.08741 * 48000), 4196);
    assert.equal(Math.round((30 / c) * 48000), 4196);
  });

  it('R7-CALC-02: the precedence offset (5–10 ms more) is named', () => {
    assert.doesNotMatch(TP, /lands with the mains/);
    assert.match(TP, /plus about 5–10 ms more, so the mains arrive first/);
  });

  it('R7-CALC-03: "normal polarity", not "in phase"', () => {
    assert.doesNotMatch(SPKADV, /in phase/i);
    assert.equal((SPKADV.match(/normal polarity/g) ?? []).length, 3);
  });

  it('R7-CALC-04: inductive reactance — voltage leads current', () => {
    assert.doesNotMatch(PWR, /inductive reactance leads \(\+\)/);
    assert.match(PWR, /inductive reactance is \+ \(voltage leads current\)/);
  });

  it('R7-CALC-05: the workflow is named after the calc it runs', () => {
    assert.doesNotMatch(WF, /'Cable Voltage Drop'/);
    assert.match(WF, /tpl\('cable-drop', 'Speaker Cable Loss',/);
    assert.match(SPK, /name: 'Speaker Cable Loss'/);
  });
});

describe('S3 — FX', () => {
  it('R7-FX-03: the hint names the ATK/REL tray', () => {
    assert.doesNotMatch(FX, /Open the ENV tray/);
    assert.match(FX, /id: 'env', label: 'ATK\/REL'/);
    assert.match(FX, /Open the ATK\/REL tray/);
  });

  it('R7-FX-04: the flanger caption says no deep notches at 100% MIX', () => {
    assert.match(FX, /v\[P\.modMix\] >= 1\n\s+\? 'At 100% MIX there is no dry signal left to cancel against, so there are no deep notches/);
  });

  it('R7-FX-05: correlation −1 is claimed only with no delay', () => {
    assert.match(FX, /v\[PHASE_INV\] > 0\.5 && v\[PHASE_DLY\] > 0\n\s+\? `Flipped AND delayed/);
    assert.match(FX, /correlation is no longer a clean −1/);
  });

  it('R7-FX-06: the limiter caption does not say NEVER', () => {
    assert.doesNotMatch(FX, /Output can NEVER exceed/);
    assert.match(FX, /Sample peaks are held at \$\{v\[P\.ceilingDb\]\} dB \(peaks between samples can still poke above/);
  });

  it('R7-FX-07: the high-pass is a 12 dB/oct slope (Butterworth biquad), not a cliff', () => {
    assert.match(BIQUAD, /static Biquad highpass\(double f0, double fs\)/);
    assert.doesNotMatch(FX, /Not a cut — a cliff\./);
    assert.match(FX, /on a steady 12 dB-per-octave slope/);
  });

  it('R7-FX-08: no spectrum is promised in the distortion hint', () => {
    assert.doesNotMatch(FX, /watch the added partials in the display/);
    assert.match(FX, /watch its round tops bend flat/);
  });

  it('R7-FX-09: MIX toward dry does not claim "the loudness holds"', () => {
    assert.doesNotMatch(FX, /the loudness holds/);
    assert.match(FX, /the clean body comes back and the grit sits underneath it/);
  });

  it('R7-FX-10: no promised quantization visual', () => {
    assert.doesNotMatch(FX, /lands with the analyzer view/);
    assert.match(FX, /but this lab does not draw them/);
  });

  it('R7-FX-11: the limiter catalog blurb matches the lab (release, GR)', () => {
    assert.doesNotMatch(CAT, /Brickwall ceiling, true-peak, loudness\./);
    assert.match(CAT, /'Brickwall ceiling, release, gain reduction \(GR\)\.'/);
  });
});

describe('S3 — modular', () => {
  it('R7-MOD-01: without retrigger, steps run legato (no slew = no glide)', () => {
    assert.doesNotMatch(CONTENT, /smear into a glide/);
    assert.match(CONTENT, /run together legato, with no new attack/);
  });
});
