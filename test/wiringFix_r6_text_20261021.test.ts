/**
 * Wiring fix round 6 (2026-10-21) — the R5 grader's text findings across the
 * Digital, Calculator, Amplifier, Mastering, Meter, Signal Chain, FX, Modular,
 * Gain and Production labs. Each item is pinned so the old wording cannot
 * come back:
 *
 *   S1  R5-DIG-01  6.02·N + 1.76 is the UNDITHERED SNR; TPDF dither costs ≈ 4.8 dB
 *   S1  R5-CALC-01 the divider / RC example uses a low-impedance source and a true 10 kΩ input
 *   S2  R5-AMP-01  Rack 1 states the amplifier's 4 Ω rating
 *   S2  R5-MAST-01 float → 24-bit is a reduction; dither is hedged, not forbidden
 *   S2  R5-MET-01  −1 dBTP is "many platforms", broadcast (ATSC A/85) −2
 *   S3  CALC-02..05, MET-02, MET-03, SC-01, FX-01, FX-02, MOD-01, GAIN-01, GAIN-02, PROD-01
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
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

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n').replace(/\n\s+/g, ' ');

const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
const { resolveStage } = await import('../src/features/production/schema.ts');
const { evaluateStage } = await import('../src/features/production/rules.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');
const { PREPROD_STAGES } = await import('../src/features/production/preprod/index.ts');
const { DESTINATIONS } = await import('../src/screens/lab/mastering/masteringContent.ts');
const { RACK_SCENARIOS } = await import('../src/features/amp/ampContent.ts');
const { LAB_LESSONS } = await import('../src/features/lab/guidedLessons/content.ts');

const ws = (id: string) => WORKSPACES.find((w) => w.id === id)!;
const def = (id: string, key: string) => LAB_LESSONS[id]!.controls.find((c) => c.key === key)!.definition;

describe('S1 R5-DIG-01 — the 146 dB figure is the undithered SNR', () => {
  it('modDac says UNDITHERED and prices TPDF dither at about 4.8 dB, like the calculator', () => {
    const s = read('src/screens/lab/digital/modules/modDac.tsx');
    assert.doesNotMatch(s, /SNR for a dithered full-scale sine/);
    assert.match(s, /SNR for an UNDITHERED full-scale sine \(quantization noise only\)/);
    assert.match(s, /TPDF dither adds about 4\.8 dB of noise, so the dithered ideal is about 141 dB/);
    // 6.02·24 + 1.76 − 4.77 ≈ 141.5 dB — the same arithmetic the calculator prints.
    const dithered = 24 * 20 * Math.log10(2) + 10 * Math.log10(1.5) - 10 * Math.log10(3);
    assert.ok(dithered > 141 && dithered < 142);
    assert.match(ws('bitdepth').warnings ?? '', /TPDF dither the noise is 4\.77 dB higher/);
  });
});

describe('S1 R5-CALC-01 — the Basic Electronics example numbers are right', () => {
  it('a low-impedance source into 10k/10k is −6 dB; 1 µF into a true 10 kΩ input is 15.9 Hz', () => {
    const ex = ws('electronics').example;
    assert.doesNotMatch(ex, /A 10 kΩ output feeding/);
    assert.match(ex, /A low-impedance source \(an output of a few ohms\) feeding a divider of R1 = 10 kΩ over R2 = 10 kΩ halves the voltage \(−6 dB\)/);
    assert.match(ex, /into a stage with a true 10 kΩ input makes an RC high-pass/);
    assert.ok(Math.abs(20 * Math.log10(10000 / 20000) - -6.02) < 0.01);
    assert.ok(Math.abs(1 / (2 * Math.PI * 10000 * 1e-6) - 15.9) < 0.05);
  });
});

describe('S2 R5-AMP-01 — Rack 1 states the amplifier rating', () => {
  it('the Mode readout says rated to 4 Ω and the explanation uses that rating', () => {
    const r = RACK_SCENARIOS.find((x) => x.id === 'rk-parallel')!;
    assert.equal(r.readout.find((x) => x.label === 'Mode')!.value, 'Stereo, amplifier rated to 4 Ω');
    assert.match(r.explain, /below the 4 Ω this amplifier is rated to in stereo/);
    assert.doesNotMatch(r.explain, /typical 4 Ω stereo minimum/);
  });
});

describe('S2 R5-MAST-01 — dither is consistent: float → 24-bit is a reduction', () => {
  it('the streaming checklist and the project plan agree, hedged', () => {
    const st = DESTINATIONS.find((d) => d.id === 'streaming')!;
    assert.ok(!st.confirm.some((c) => /No dither on the 24-bit/.test(c)));
    assert.ok(st.confirm.some((c) => /^Most mastering engineers dither 24-bit files too: float to 24-bit is a reduction$/.test(c)));
    const p = read('src/screens/lab/mastering/modules/mod8Project.tsx');
    assert.doesNotMatch(p, /No dither on the 24-bit/);
    assert.match(p, /float to 24-bit is still a reduction\. Most mastering engineers do, though it matters far less than at 16-bit\./);
  });
});

describe('S2 R5-MET-01 — −1 dBTP is not universal', () => {
  it('every ceiling line names many platforms and broadcast (ATSC A/85) −2', () => {
    const s = read('src/screens/lab/meter/modules/modMeterA.tsx');
    assert.doesNotMatch(s, /specs demand −1 dBTP/);
    assert.doesNotMatch(s, /ask for a −1 dBTP ceiling/);
    assert.doesNotMatch(s, /park the true peak at −1 dBTP/);
    assert.doesNotMatch(s, /THE −1 dBTP CEILING/);
    assert.match(s, /many platforms ask −1 dBTP; broadcast under ATSC A\/85, −2/);
    assert.match(s, /many platforms ask −1 dBTP; broadcast \(ATSC A\/85\) −2/);
    assert.match(s, /Many platforms ask for a true peak of −1 dBTP \(broadcast under ATSC A\/85: −2\)/);
    assert.match(s, /THE TRUE-PEAK CEILING — MIND THE GAP/);
  });
});

describe('S3 Calculator — pointers, names, the limiter example, whole bits', () => {
  it('CALC-02: no pointer to the time-alignment workspace for dBFS / dBm', () => {
    const w = ws('level').warnings ?? '';
    assert.doesNotMatch(w, /Analog Alignment/);
    assert.match(w, /so this tool does not convert it either/);
  });
  it('CALC-03: the mic sensitivity pointer uses the real workspace name', () => {
    const s = read('src/screens/lab/calc/workspaces/splSafety.ts');
    assert.doesNotMatch(s, /Mic Sensitivity & Output/);
    assert.match(s, /convert it first in Mic Sensitivity Converter/);
    assert.ok(WORKSPACES.some((w) => w.name === 'Mic Sensitivity Converter'));
  });
  it('CALC-04: 6.2 dBu is the speaker rated level at the processor, not a clip point', () => {
    const ex = ws('limiter').example;
    assert.doesNotMatch(ex, /processor sees clip/);
    assert.match(ex, /the speaker’s rated level sits at 38\.2 − 32 = 6\.2 dBu at the processor/);
  });
  it('CALC-05: the bit-depth field takes whole numbers only', () => {
    const f = ws('bitdepth').fields.find((x) => x.key === 'bits')!;
    assert.equal(f.integer, true);
  });
});

describe('S3 Meter / Signal Chain / FX / Modular — guided-lesson and catalog text', () => {
  it('MET-02: sample-peak in microseconds; quasi-peak (PPM) integrates ~5–10 ms', () => {
    const d = def('meter', 'ballistics');
    assert.match(d, /Sample-peak meters: microseconds up; quasi-peak meters \(PPM\) integrate over about 5–10 ms/);
    assert.doesNotMatch(d, /Peak meters: microseconds up, slow fall/);
  });
  it('MET-03: the pink tilt is tied to this FFT display', () => {
    assert.match(read('src/screens/lab/meter/modules/modMeterB.tsx'), /≈ −3 dB\/oct on this FFT display/);
  });
  it('SC-01: Comp → Gate is this rack’s fixed order', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    assert.match(cat, /blurb: 'This rack’s fixed order: Generator → EQ → Comp → Gate/);
    assert.match(LAB_LESSONS.chain!.whatItIs, /a full processing chain in this rack’s fixed order — Source → EQ → Compressor → Gate/);
  });
  it('FX-01: the Equalizer blurb matches the one-band lab', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    assert.match(cat, /\{ name: 'Equalizer', blurb: 'One EQ band: bell, shelves or pass filters, with frequency, gain and Q\.', route: 'EqLab' \}/);
    assert.doesNotMatch(cat, /blurb: 'Graphic, parametric, shelves, filters, dynamic EQ\.'/);
  });
  it('FX-02: mono-fold says inverted polarity cancels and delay combs', () => {
    const d = Object.values(LAB_LESSONS).flatMap((l) => l.controls).filter((c) => c.key === 'mono_fold').map((c) => c.definition).join(' ');
    assert.match(d, /Anything flipped in one channel but not the other cancels, and anything delayed between channels combs here/);
    assert.doesNotMatch(d, /out of phase cancels or combs/);
  });
  it('MOD-01: the Raw Drone names the envelope on the VCA', () => {
    const d = Object.values(LAB_LESSONS).flatMap((l) => l.controls).find((c) => c.key === 'patch_drone')!.definition;
    assert.match(d, /nothing modulating anything except the envelope on the VCA\./);
  });
});

describe('S3 Gain — the drawing is a mic and a channel strip', () => {
  it('GAIN-01: the low source reads "a quiet mic"', () => {
    const v = read('src/screens/lab/gain/gainViz.tsx');
    assert.match(v, /\? 'a quiet mic'/);
    assert.doesNotMatch(v, /quiet instrument\/source/);
  });
  it('GAIN-02: the multistage blurb no longer says "rack of real devices"', () => {
    const r = read('src/screens/lab/gain/modules/registry.ts');
    assert.doesNotMatch(r, /rack of real devices/);
    assert.match(r, /A channel strip as a chain of stages/);
  });
});

describe('S3 R5-PROD-01 — every spelling of a preamp is a mic input', () => {
  const fire = (to: string) => {
    const st = resolveStage(PREPROD_STAGES.find((s) => s.stageId === 'technical')!, 'music');
    const values = { 'technical.signal_path': [{ sp_from: 'Bass', sp_level: 'instrument', sp_via: '', sp_to: to }] };
    const p = { ...newProject('preprod', 'music', 'Test'), pathway: 'music' as const, values: values as never };
    return evaluateStage(st, p).map((f) => f.ruleId).includes('technical-level-format-conflict');
  };
  it('preamplifier, "pre amp" and "pre-amp" fire; real amps do not', () => {
    for (const to of ['Mic preamplifier', 'Preamplifier', 'pre amp', 'Mic pre amp ch 1', 'Mic pre-amp', 'Mic preamp']) assert.ok(fire(to), to);
    for (const to of ['Bass amp', 'Bass amplifier', 'Guitar amps', 'Combo']) assert.ok(!fire(to), to);
  });
});
