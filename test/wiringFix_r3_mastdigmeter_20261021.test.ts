/**
 * Wiring & signal-flow fixes, round 3 (2026-10-21) — Mastering, Digital,
 * Meter and De-Esser. Each block fails if the wrong wording comes back.
 *
 *  R3-MA-01  the controller note fits BOTH the graded "converts inside
 *            itself" case and the drawn USB-from-the-DAW cable.
 *  R3-DG-01  the anti-aliasing / reconstruction anchors are hedged to the
 *            classic model, not "always".
 *  R3-DG-02  the ADC chain glossary matches the drawn FULL_STAGES (no
 *            separate "analog gain" block).
 *  R3-DG-03  the waveform-view glossary names the mic's voltage — no preamp
 *            is drawn between the mic and the voltage window.
 *  R3-DG-04  the Errors & Limits blurb promises only what is taught (jitter).
 *  R3-MT-01  60 Hz is the North American mains frequency, not every mains.
 *  R3-MT-02  pink noise is a −3 dB/octave ramp on an FFT display only.
 *  R3-DE-01  (already fixed in aec87591 — pinned here so it stays fixed.)
 *  R3-DE-02  the band-pass detector is THIS lab's; many de-essers use a
 *            high-pass, and no quiz option calls that wrong.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkMonitorPath } from '../src/screens/lab/mastering/masteringEngine.ts';
import { PATH_SIDECHAIN } from '../src/features/deesser/deEsserModel.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('R3-MA-01 — the controller note agrees with the grade and the drawing', () => {
  const r = checkMonitorPath(['daw', 'monitorCtl', 'dac', 'active']);
  const note = r.notes.find((n) => /controller is the analog kind/.test(n));
  it('a separate converter after the controller still fails, with the reworded note', () => {
    assert.equal(r.ok, false);
    assert.ok(note, 'the note is present');
    assert.match(note!, /^When a separate converter is in the chain/);
    assert.match(note!, /converter built in takes USB straight from the DAW/);
    assert.doesNotMatch(note!, /This lab’s controller is an analog monitor controller/);
  });
  it('the converter-built-in controller the note describes is graded COMPLETE and drawn with USB from the DAW', () => {
    assert.equal(checkMonitorPath(['daw', 'monitorCtl', 'active']).grade, 'complete');
    const art = read('src/screens/lab/mastering/mastArt.tsx');
    assert.match(art, /if \(a === 'daw'\) return b === 'dac' \|\| b === 'monitorCtl' \? 'usb' : 'line';/);
  });
});

describe('R3-DG-01 — the filter anchors are the classic model, not a law', () => {
  const s = read('src/screens/lab/digital/modules/modDac.tsx');
  it('hedged hint', () => {
    assert.match(s, /wrongHint: 'In the classic model drawn here, two anchors: anti-aliasing comes right before the ADC; reconstruction comes right after the DAC\.'/);
    assert.doesNotMatch(s, /always immediately (before|after)/);
  });
});

describe('R3-DG-02 / R3-DG-03 — Digital glossary matches the drawings', () => {
  const c = read('src/features/lab/guidedLessons/content.ts');
  it('ADC chain: no separate analog gain block (FULL_STAGES is mic → preamp → AA filter → …)', () => {
    assert.match(c, /definition: 'Mic → preamp → anti-aliasing filter → sample-and-hold → quantizer → encoder → PCM stream\./);
    assert.doesNotMatch(c, /preamp → analog gain → anti-aliasing/);
    const viz = read('src/screens/lab/digital/vizChain.tsx');
    const full = viz.slice(viz.indexOf('const FULL_STAGES'), viz.indexOf('];', viz.indexOf('const FULL_STAGES')));
    assert.deepEqual([...full.matchAll(/key: '(\w+)'/g)].map((m) => m[1]), ['mic', 'preamp', 'filter', 'sh', 'quant', 'encoder', 'pcm']);
  });
  it('waveform view: the mic’s voltage, not "leaving the preamp"', () => {
    assert.match(c, /and the continuous voltage the mic puts out\./);
    assert.doesNotMatch(c, /voltage leaving the preamp/);
  });
});

describe('R3-DG-04 — Errors & Limits blurb', () => {
  it('names jitter, no longer promises "clocking"', () => {
    const s = read('src/screens/lab/digital/modules/registry.ts');
    const line = s.split('\n').find((l) => l.includes("id: 'errors'"))!;
    assert.match(line, /jitter \(timing errors in the sample clock\)/);
    assert.doesNotMatch(line, /clocking/);
  });
});

describe('R3-MT-01 — 60 Hz is one mains frequency, not every mains', () => {
  const c = read('src/screens/lab/meter/modules/modMeterC.tsx');
  const b = read('src/screens/lab/meter/modules/modMeterB.tsx');
  it('Meter C hum card: the answer option and hint speak of the mains frequency', () => {
    assert.match(c, /'Spikes at the mains frequency and its exact multiples',/);
    assert.match(c, /60 Hz in North America \(drawn here\) and 50 Hz in most other countries/);
    assert.match(c, /wrongHint: 'What in every studio oscillates at the mains frequency, forever\?'/);
    assert.match(c, /50\/100\/150 Hz in most other countries/);
    assert.doesNotMatch(c, /exactly 60 Hz|'Spikes at 60 Hz|'The 60 Hz comb/);
  });
  it('Meter B blurbs and checks', () => {
    assert.match(b, /hum: 'Thin spikes at the mains frequency \(60 Hz in North America, 50 Hz in most other countries\)/);
    assert.match(b, /\(60, 120, 180, 240 Hz… here; 50, 100, 150 Hz… in most other countries\)/);
    assert.match(b, /locked to the mains frequency and its multiples \(60\/120\/180 Hz here\)/);
    assert.doesNotMatch(b, /Thin spikes at 60 Hz|locked to 60\/120\/180 Hz;/);
  });
  it('the drawn hum is still a 60 Hz series, so "here" is true', () => {
    // meterEngine.test pins peakOfPattern('hum') ≈ 60 Hz; this pins that the copy says so.
    assert.match(c, /drawn here/);
  });
});

describe('R3-MT-02 — pink-noise ramp is display-dependent', () => {
  it('glossary', () => {
    const c = read('src/features/lab/guidedLessons/content.ts');
    assert.match(c, /Pink noise = smooth −3 dB\/octave ramp on an FFT display \(flat on a 1\/3-octave RTA\)\./);
  });
});

describe('R3-DE-01 / R3-DE-02 — de-esser filter wording', () => {
  const s = read('src/screens/lab/deesser/DeEsserLabScreen.tsx');
  it('R3-DE-01 (already fixed): "never passes through the filter" and "untouched" are broadband-only', () => {
    const lead = s.indexOf("? 'Tap each block, or walk the signal. Notice that the side chain’s band-pass only listens");
    assert.ok(lead > 0, 'split-band prompt is its own branch');
    assert.ok(s.indexOf('the voice itself never passes through the filter') > lead, 'the broadband prompt is the else branch');
    assert.match(s, /The band split in the main path is a different job/);
  });
  it('R3-DE-02: band-pass is hedged as this lab’s choice, in the body (both modes) and the block', () => {
    const hedge = 'This lab’s de-esser listens through a band-pass; many de-essers offer a high-pass instead, or a switch between the two.';
    assert.equal(s.split(hedge).length - 1, 2, 'both split-band and broadband bodies carry the hedge');
    const bpf = PATH_SIDECHAIN.find((b) => b.id === 'bpf')!;
    assert.match(bpf.what, /many offer a high-pass or a switch between the two/);
  });
  it('R3-DE-02: no quiz option makes a non-band-pass detector look wrong', () => {
    assert.doesNotMatch(s, /high shelf, not a band-pass/);
    assert.match(s, /question="In this lab's de-esser, where does the band-pass filter sit\?"/);
    assert.match(s, /'Nowhere — the detector hears the whole voice, unfiltered'/);
    assert.match(s, /'A compressor whose detector listens through a hiss filter'/);
    assert.doesNotMatch(s, /The voice passes through the gain element untouched until the gain moves\./);
  });
});
