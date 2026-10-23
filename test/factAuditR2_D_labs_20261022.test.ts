/**
 * Fact audit Round 2 (Comp B return, 2026-10-22) — group D, labs under
 * src/screens/lab/ (calculators, foundations, wave, cable, sound systems …).
 * Pins a sample of the corrected wording: the new text is present and the
 * wrong claim is gone. Source is read with CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LAB = path.resolve(HERE, '../src/screens/lab');
const read = (rel: string) => readFileSync(path.join(LAB, rel), 'utf8').replace(/\r\n/g, '\n');

type Pin = { id: string; file: string; has: string; gone: string };
const PINS: Pin[] = [
  { id: 'F003503', file: 'amp/modules/mod3Bias.tsx', has: 'runs hottest with no signal', gone: 'Idle current and heat are moderate' },
  { id: 'F003822', file: 'cable/data/connectors.analog.ts', has: 'Many fixtures use 3-pin XLR anyway, though the standard forbids it', gone: 'some fixtures use XLR-shell connectors' },
  { id: 'F005548', file: 'cable/data/lesson02.ts', has: 'pick up less of each other’s signal (crosstalk)', gone: 'twisted at its own rate to reject interference' },
  { id: 'F005782', file: 'cable/data/lesson07.ts', has: 'Some TRUE1 models are rated to break a live load', gone: 'the rule for both is the same' },
  { id: 'F005937', file: 'cable/data/lesson08.ts', has: 'Plugging or unplugging a live line can pop loudly through the system — and here the pop goes straight into a power amplifier', gone: 'The contacts bridge on the way in and out, popping through the system — and here' },
  { id: 'F006186', file: 'cable/data/lesson09.ts', has: 'so the fuse blows or the breaker trips; without it, a fault can leave the metal chassis live', gone: 'keeps a fault from energizing the equipment chassis' },
  { id: 'F006420', file: 'cable/data/lesson11.ts', has: 'its current rating must be at or above what the device needs', gone: 'must match on every item — voltage, DC type, polarity symbol, current' },
  { id: 'F006424', file: 'cable/data/lesson11.ts', has: 'the current rating must be at or above the device’s need', gone: 'current capacity must ALL match' },
  { id: 'F088984', file: 'calc/symbolsKey.ts', has: '1/(2πfC)', gone: '1/2πfC)' },
  { id: 'F089110', file: 'calc/workspaces/ampacity.ts', has: '240.4(D) covers copper from 18 to 10 AWG', gone: 'covers 14, 12 and 10 AWG only' },
  { id: 'F089177', file: 'calc/workspaces/digitalAdv.ts', has: 'or AVB straight on Ethernet', gone: 'Audio-over-IP (Dante, AES67, AVB)' },
  { id: 'F089239', file: 'calc/workspaces/digitalAdv.ts', has: 'Multirate Signal Processing for Communication Systems', gone: 'Proc. IEEE 1978' },
  { id: 'F089278', file: 'calc/workspaces/digitalAdv.ts', has: 'a whole block must fill before it can be processed', gone: 'one block to fill going in, one coming out' },
  { id: 'F089322', file: 'calc/workspaces/dynamics.ts', has: 'real gain reduction is MORE than this model shows', gone: 'is less than this model shows' },
  { id: 'F089451', file: 'calc/workspaces/levels.ts', has: 'IEC 60268-3 for amplifiers, IEC 60268-5 for loudspeakers', gone: 'IEC 60268-3/-5' },
  { id: 'F089677', file: 'calc/workspaces/loudness.ts', has: 'The window length, not the step, is what makes the two meters react at different speeds', gone: 'block step (75% overlap) that makes the two meters' },
  { id: 'F090073', file: 'calc/workspaces/roomsMusic.ts', has: 'the MIDI number minus the nearest whole note, times 100', gone: 'the fractional part times 100' },
  { id: 'F090651', file: 'calc/workspaces/splSafety.ts', has: 'ten raised to the power of (the target increase in dB divided by ten)', gone: 'raised to the target increase in dB, divided by ten' },
  { id: 'F008935', file: 'cymatics/LiquidStudioScreen.tsx', has: 'under the raised crests, which act like small lenses', gone: 'where the surface is concave' },
  { id: 'F000591', file: 'foundations/FoundationsCourseScreen.tsx', has: 'Your eardrum is ~1 cm across.', gone: 'Your eardrum is ~6 mm.' },
  { id: 'F000653', file: 'foundations/FoundationsCourseScreen.tsx', has: 'how strong, and how they line up in time', gone: '(which sines, how strong). Same information' },
  { id: 'F014552', file: 'micselect/micSelectData.ts', has: 'how far a 94 dB SPL reference signal sits above the mic’s own noise', gone: 'Sensitivity and self-noise combined' },
  { id: 'F084732', file: 'roomdesign/roomModel.ts', has: 'Class A under ASTM E84', gone: 'UL 94' },
  { id: 'F087585', file: 'wave/modules/modWaveA.tsx', has: 'the breeze does carry sound', gone: 'the breeze cannot carry it anywhere' },
  { id: 'F087647', file: 'wave/modules/modWaveA.tsx', has: 'A room mic for the kick drum ends up parked at a NODE', gone: "'A kick drum mic ends up parked" },
];

describe('fact audit R2 — group D (labs)', () => {
  for (const p of PINS) {
    it(`${p.id}: ${p.file}`, () => {
      const src = read(p.file);
      assert.ok(src.includes(p.has), `${p.id}: corrected wording missing`);
      assert.ok(!src.includes(p.gone), `${p.id}: old wrong wording still present`);
    });
  }

  it('no cable-lab line says an amp output belongs ONLY on loudspeaker terminals', () => {
    for (const f of ['cable/data/lesson01.ts', 'cable/data/lesson08.ts', 'cable/data/lesson11.ts']) {
      assert.ok(!read(f).includes('belongs only on loudspeaker terminals'), f);
    }
  });

  it('F084866: the FM aliasing flag tests the TOP of the Carson band, not its width', () => {
    const src = read('FmLabScreen.tsx');
    assert.match(src, /const bandTop = carrier \+ carson \/ 2;/);
    assert.ok(!src.includes('carson > NYQUIST'), 'width compared with Nyquist');
  });
});
