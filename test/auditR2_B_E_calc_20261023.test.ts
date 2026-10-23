/**
 * Audit R2, Round B (last round) — group E_calc text (2026-10-23).
 *
 * Pins every Round-B wording fix in src/screens/lab/calc/**: the clarified
 * text is present and the old wording is gone. Sources are read with CRLF
 * normalised. Round A's calculator logic is pinned by
 * auditR2_A_E_calc_20261023.test.ts and is not touched here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (rel: string): string => readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

const FIXES: { id: string; file: string; now: string; gone: string }[] = [
  {"id": "R025787", "file": "src/screens/lab/calc/workspaces/wavesAdv.ts", "now": "with close tones, 2f₁−f₂ and 2f₂−f₁ sit so close to the two tones you fed in that no practical filter can split them off.", "gone": "with close tones, 2f₁−f₂ and 2f₂−f₁ sit so close to them that no practical filter separates them."},
  {"id": "R027223", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "'Forgetting bandwidth is per DIRECTION — a full-duplex link carries its full rate each way, so check the sending and the receiving traffic against the link on their own; do not add them.',", "gone": "'Forgetting bandwidth is per DIRECTION — a full-duplex flow needs the rate both ways.',"},
  {"id": "R027224", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "'Running audio and control/other traffic on a switch with no QoS and hoping the other traffic stays light — AoIP wants QoS and headroom.',", "gone": "'Running audio and control/other traffic on an unmanaged, uncongested-by-luck switch — AoIP wants QoS and headroom.',"},
  {"id": "R031650", "file": "src/screens/lab/calc/workspaces/levels.ts", "now": "The same dB result describes both only when the load stays the same, because power goes as voltage squared.", "gone": "Same dB result describes both only because power goes as voltage squared."},
  {"id": "R031696", "file": "src/screens/lab/calc/workspaces/levels.ts", "now": "note: 'The offset is fixed: 20·log10(0.7746 V ÷ 1 V)", "gone": "note: 'The offset is exact: 20·log10(0.7746 V ÷ 1 V)"},
  {"id": "R032243", "file": "src/screens/lab/calc/workspaces/powerElec.ts", "now": "the heat output equals the wattage times 3.4121 (BTU per hour for each watt); and the cooling airflow equals the heat output divided by the product of 1.08 and the temperature rise in °F.", "gone": "the heat output equals the wattage times 3.4121 BTU per hour; and the cooling airflow equals the heat output divided by 1.08 times the temperature rise."},
  {"id": "R041383", "file": "src/screens/lab/calc/workspaces/levels.ts", "now": "real impedance swings with frequency. It often dips below the nominal figure, and on some speakers it falls close to half of it.", "gone": "real impedance swings with frequency, often dipping near half the nominal figure at some frequencies."},
  {"id": "R041437", "file": "src/screens/lab/calc/workspaces/roomsMusic.ts", "now": "'42.9 Hz (width), 68.6 Hz (height). Note that the height fundamental and the second length ' +\n    'mode stack at 68.6 Hz, and they stack again at 137.3 Hz — a 2:1 dimension ratio piles ' +\n    'modes on the same frequencies.',", "gone": "'42.9 Hz (width), 68.6 Hz (height). Note that the second-order height mode (137.3 Hz) and ' +\n    'the fourth-order length mode (137.3 Hz) stack — a 2:1 dimension ratio piles modes on the ' +\n    'same frequencies.',"},
  {"id": "R047052", "file": "src/screens/lab/calc/workspaces/wavesAdv.ts", "now": "few centimetres of driver offset can be tens of degrees of phase error at the crossover; a metre ' +\n    'of sub-to-top offset is a few milliseconds you can dial back in with delay.',", "gone": "few centimetres of driver offset is degrees of phase error at the crossover; a metre of sub-to-' +\n    'top offset is milliseconds you can dial back in with delay.',"},
  {"id": "R047055", "file": "src/screens/lab/calc/workspaces/wavesAdv.ts", "now": "'Aligning by ear or by phase at one frequency only — a phase match at one frequency can be a whole cycle off, and crossover filters shift phase by a different amount at each frequency. A fixed delay fixes only the travel time (for one spot); still check polarity and crossover phase across the whole overlap band.',", "gone": "'Aligning by ear at one frequency and ignoring the rest — a fixed delay fixes timing at every frequency (for one spot), but polarity and crossover phase still need checking.',"},
  {"id": "R047106", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "'MAC/s — far too heavy to run in real time by brute force, which is why FFT partitioning exists.", "gone": "'MAC/s — far past real time by hand, which is why FFT partitioning exists."},
  {"id": "R047127", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "`Uniform-block convolution adds about one block of delay; mixed-size (non-uniform) partitioned schemes keep the FIRST block small to cut this.`,", "gone": "`Uniform-block convolution adds about one block of delay; partitioned schemes keep the FIRST block small to cut this.`,"},
  {"id": "R047293", "file": "src/screens/lab/calc/workspaces/micsRf.ts", "now": "Higher bands (like today’s crowded UHF) lose more over the same distance, and ' +", "gone": "Higher bands (like today’s crowded UHF) lose more per metre, and ' +"},
  {"id": "R047353", "file": "src/screens/lab/calc/symbolsKey.ts", "now": "meaning: 'Changes by the same ratio: double one and the other doubles.',", "gone": "meaning: 'Rises and falls together with.',"},
  {"id": "R050139", "file": "src/screens/lab/calc/workspaces/splSafety.ts", "now": "Most dynamics ≈ 1–3 mV/Pa; most condensers ≈ 5–40 mV/Pa.", "gone": "Dynamics ≈ 1–3 mV/Pa; condensers ≈ 8–40 mV/Pa."},
  {"id": "R052694", "file": "src/screens/lab/calc/workspaces/timePhase.ts", "now": "in overlapping PA coverage. Knowing where the nulls fall tells you to treat it as a ' +\n    'placement problem, not an EQ problem.',", "gone": "in overlapping PA coverage. Knowing where the nulls fall tells you whether to hear it as a ' +\n    'placement problem, not an EQ problem.',"},
  {"id": "R052752", "file": "src/screens/lab/calc/workspaces/splSafety.ts", "now": "help: 'Extra dB below the level that puts the speaker’s rated voltage on its terminals — insurance for rating optimism and impedance dips.'", "gone": "help: 'Extra dB below the computed clip-equivalent threshold — insurance for rating optimism and impedance dips.'"},
  {"id": "R053099", "file": "src/screens/lab/calc/workspaces/levels.ts", "now": "Hz — but that always sits above the musical middle, toward the higher frequency.`,", "gone": "Hz — but that sits closer to the top octave, not the audible middle.`,"},
  {"id": "R055388", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "In practice you round up to the next standard depth (16, 24, 32).", "gone": "In practice you round to the nearest standard depth (16, 24, 32)."},
  {"id": "R055392", "file": "src/screens/lab/calc/workspaces/digitalAdv.ts", "now": "in practice you would pick 16-bit, the next standard depth up.)`,", "gone": "in practice you would pick 16-bit, the nearest standard depth.)`,"},
  {"id": "R055425", "file": "src/screens/lab/calc/workspaces/speakers.ts", "now": "'Constant-voltage lines exist to make long multi-speaker runs practical. High voltage means ' +\n    'low current, so the line can use lighter cable than an 8 Ω run and still feed dozens of speakers. Line loss still applies on long runs. But the amplifier’s ' +", "gone": "'Constant-voltage lines exist to make long multi-speaker runs practical — high voltage means ' +\n    'low current, so lighter cable than an 8 Ω run and dozens of speakers per line work — line loss still applies on long runs. But the amplifier’s ' +"},
  {"id": "R055429", "file": "src/screens/lab/calc/workspaces/speakers.ts", "now": "the cable loss math (see Speaker Cable Loss) turns brutal past ~20–30 m of light-gauge cable into a low-impedance load. For a few full-range speakers, moving the amplifier nearer (or using powered speakers) is the other fix.',", "gone": "the cable loss math (see Speaker Cable Loss) turns brutal past ~20–30 m on light gauge into low impedance. For a few full-range speakers, moving the amplifier nearer (or powered speakers) is the other fix.',"},
  {"id": "R055589", "file": "src/screens/lab/calc/workspaces/roomsAdvanced.ts", "now": "'Panel and Helmholtz resonators put absorption in the band where a mode or a boom lives, using ' +", "gone": "'Panel and Helmholtz resonators put absorption exactly where a mode or a boom lives, using ' +"},
  {"id": "R055644", "file": "src/screens/lab/calc/workspaces/roomsMusic.ts", "now": "the top dies, the bottom keeps booming, and the room can sound worse than untreated.',", "gone": "the top dies, the bottom keeps booming, and the room sounds worse than untreated.',"},
  {"id": "R056059", "file": "src/screens/lab/calc/workflowCatalog.ts", "now": "note: '3:1 spacing for two mics on different sources, so bleed stays clean in mono.' }", "gone": "note: 'Minimum spacing to keep bleed clean in mono.' }"},
  {"id": "R056026", "file": "src/screens/lab/calc/workflowCatalog.ts", "now": "note: 'Critical distance from room volume, RT60 and source directivity.' }", "gone": "note: 'Critical distance from RT60 and source directivity.' }"},
];

describe('audit R2 round B — calculator text', () => {
  for (const f of FIXES) {
    it(`${f.id}: ${f.file}`, () => {
      const s = read(f.file);
      assert.ok(s.includes(f.now), `${f.id}: new wording missing`);
      assert.ok(!s.includes(f.gone), `${f.id}: old wording still present`);
    });
  }

  it('R047353: the proportional example is a real proportion (intensity, not SPL in dB)', () => {
    const s = read('src/screens/lab/calc/symbolsKey.ts');
    assert.ok(s.includes("example: 'Intensity ∝ 1 / r²'"));
    assert.ok(!s.includes("example: 'SPL ∝ 1 / r²'"));
  });

  it('bit depth always rounds UP to a standard depth, never to the nearest', () => {
    const s = read('src/screens/lab/calc/workspaces/digitalAdv.ts');
    assert.doesNotMatch(s, /nearest standard depth/);
  });

  it('speakers.ts keeps the wiring rule: light-gauge, never "thin cable"', () => {
    assert.doesNotMatch(read('src/screens/lab/calc/workspaces/speakers.ts'), /thin cable/);
  });
});
