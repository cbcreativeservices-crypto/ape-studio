/**
 * Fact audit 2026-10-22 — cleanup pass after the three rounds: partner lines the
 * round agents flagged in files outside their lists.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = join(import.meta.dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\r\n/g, '\n');

type Det = { id: string };
type DetectMod = {
  initialDetectState: () => unknown;
  analyze: (input: unknown, state: unknown) => { raw: Det[] };
};

// A quiet spectrum (-110 dBFS) with narrow spikes at the given frequencies.
function spectrum(spikes: Record<number, number>, sampleRate = 48000, fftSize = 8192) {
  const hzPerBin = sampleRate / fftSize;
  const spec = new Float32Array(fftSize / 2).fill(-110);
  for (const [hz, db] of Object.entries(spikes)) spec[Math.round(Number(hz) / hzPerBin)] = db;
  return { tMs: 0, spectrumDb: spec, sampleRate, fftSize, meter: null, waveClipped: false, pitch: null };
}

describe('multimeter: rectified-supply buzz is caught on 50 Hz power too', () => {
  it('a lone 100 Hz spike reports the 100 Hz harmonic; a lone 120 Hz spike still reports 120', async () => {
    const d = (await import('../src/screens/tools/multiMeterDetect.ts')) as unknown as DetectMod;
    const ids = (s: Record<number, number>) => d.analyze(spectrum(s), d.initialDetectState()).raw.map((x) => x.id);
    assert.ok(ids({ 100: -40 }).includes('hum_100'));
    assert.ok(!ids({ 100: -40 }).includes('hum_120'));
    assert.ok(ids({ 120: -40 }).includes('hum_120'));
    assert.ok(!ids({ 120: -40 }).includes('hum_100'));
  });
  it('the help text no longer says the buzz is 120 Hz only', () => {
    const help = read('features/lab/guidedLessons/toolHelp.tsx');
    assert.match(help, /supply buzz at twice the mains \(100 or 120 Hz\)/);
    assert.doesNotMatch(help, /120 Hz supply buzz \(on 60 Hz power\)/);
  });
});

describe('cleanup partners', () => {
  it('bass 4x10 cabinet is drawn 24 in wide x 30 in tall (maker spec), matching the lesson text', () => {
    const spk = read('screens/lab/miking/lessons/shared/speakers/speakerModel.ts');
    assert.match(spk, /w: \{ mm: 24 \* IN, prov: src\('AMP-410', 'DIMENSIONS \(W x H x D\) 24" x 30" x 19"'\) \}/);
    assert.match(spk, /h: \{ mm: 30 \* IN,/);
    assert.match(read('screens/lab/miking/lessons/c08BassAmp/lesson.ts'), /about 61 cm wide, 76 cm tall and 48 cm deep/);
  });
  it('mic cutaway caption: displacement lags the driving force, not the front pressure', () => {
    const a = read('screens/lab/micspeaker/micCutawayAsset.ts');
    assert.match(a, /runs about 180° behind the force driving it\./);
    assert.doesNotMatch(a, /behind the front-face pressure/);
  });
  it('E13 matches E12: as few supports as you can, not a fixed two', () => {
    const e13 = read('screens/lab/miking/lessons/e13MixedEnsemble/lesson.ts');
    assert.doesNotMatch(e13, /at most two supports/);
    assert.match(e13, /as few supports as you can/);
  });
  it('speaker lesson names the mic’s tone among what decides feedback', () => {
    assert.match(read('screens/lab/miking/lessons/spk/lesson.ts'), /the pattern, the placement, the mic’s tone and the monitors decide it\./);
  });
  it('Rhodes quiz: a speaker output never goes into a desk input', () => {
    const r = read('screens/lab/miking/lessons/i11aRhodes/lesson.ts');
    assert.doesNotMatch(r, /'No — a speaker output goes only to a speaker'/);
    assert.match(r, /'No — a speaker output never goes into a desk input'/);
  });
  it('tuning: four fifths make a pure third only after dropping two octaves', () => {
    assert.match(read('screens/lab/tuning/chapters/index.ts'), /four of them, less two octaves, make a pure third/);
    assert.match(read('screens/lab/tuning/chapters/ch9Meantone.tsx'), /four fifths, brought down two octaves, make a pure 5:4 major third/);
  });
  it('boom camera: the second shot is called the wider shot everywhere a learner reads it', () => {
    assert.doesNotMatch(read('screens/lab/miking/lessons/b04BoomCamera/model.ts'), /for the wide shot|In the wide shot/);
  });
  it('two-mic walk pages say "mic B" for the polarity flip', () => {
    for (const p of ['b08Audience', 'b13FieldDiamond', 'b15TrackGymCombat']) {
      assert.doesNotMatch(read(`screens/lab/miking/lessons/${p}/pages.tsx`), /Flip B’s POLARITY/, p);
    }
  });
});
