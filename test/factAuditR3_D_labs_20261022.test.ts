/**
 * Fact audit Round 3 (Comp B return, 2026-10-22) — group D_labs.
 * Pins a sample of the HEDGE / CONTEXT / CAN'T CONFIRM fixes in src/screens/lab
 * (outside miking and mixingGuides): the corrected wording is present and the
 * overstated wording is gone. Source is read with CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

const CASES: { id: string; file: string; now: string; gone: string }[] = [
  { id: "F084938", file: "src/screens/lab/HarmonicsView.tsx", now: "until you switch on the override above. This lesson needs the mic to hear the speaker, so keep the volume low.", gone: "until you switch on the override above (use headphones, or the built-in mic will hear the speaker)." },
  { id: "F085034", file: "src/screens/lab/NoiseLabScreen.tsx", now: "the reference noise that holds equal energy in every octave", gone: "the reference noise that sounds equally loud in every octave" },
  { id: "F003592", file: "src/screens/lab/amp/modules/mod5ClassD.tsx", now: "Averaged over a whole audio cycle the duty is ${Math.round(sim.meanDuty * 100)}% at any level — silence is 50% too — so that long average carries no audio; the short-term average, swinging with the widths, is the audio.", gone: "Averaged over the whole cycle the duty is ${Math.round(sim.meanDuty * 100)}% at any level — silence is 50% too — so the average carries nothing; the SWING of the widths is the audio." },
  { id: "F004222", file: "src/screens/lab/cable/data/connectors.digital.ts", now: "power above 60 W flows only through rated, e-marked cables", gone: "higher power flows only through rated, e-marked cables" },
  { id: "F004529", file: "src/screens/lab/cable/data/connectors.power.ts", now: "Treat an appliance coupler as a connector, not a switch. Separating one", gone: "Ordinary appliance couplers are not certified to be connected or disconnected under load — that capability is a separate IEC 60320 classification (coupler with breaking capacity) these cordsets do not carry. Separating one" },
  { id: "F004863", file: "src/screens/lab/cable/data/connectors.recognition.ts", now: "Normalled bays pass signal with no cable inserted; a plug in the bottom (input) jack breaks that path. On most half-normalled bays a plug in the top jack only takes a copy", gone: "Normalled bays pass signal with no cable inserted; patching changes routing, it does not simply \"add\" a connection" },
  { id: "F004920", file: "src/screens/lab/cable/data/connectors.recognition.ts", now: "consequence: 'Channels land on the wrong pins: no signal, or the wrong channels appear. If a digital (AES3) DB25 lands on analog inputs, expect loud noise — keep monitors down.", gone: "consequence: 'Channels land on the wrong pins: no signal, or the wrong channels appear — a routing failure, not equipment damage." },
  { id: "F005743", file: "src/screens/lab/cable/data/lesson06.ts", now: "No live sound travels down a MIDI cable.", gone: "No sound ever travels down a MIDI cable." },
  { id: "F006102", file: "src/screens/lab/cable/data/lesson08.ts", now: "Making or breaking a coupler while it carries current can arc and pit the contacts. Switch the equipment off", gone: "Ordinary appliance couplers are not certified to be connected or disconnected under load. Switch the equipment off" },
  { id: "F007332", file: "src/screens/lab/cableinstall/data/scenarios.ts", now: "reveal: 'Other systems are not cable supports outside a few narrow code exceptions — life-safety systems never.", gone: "reveal: 'Other systems are never cable supports — life-safety systems least of all." },
  { id: "F007539", file: "src/screens/lab/cableinstall/scenes/CeilingScene.tsx", now: "(or run in a raceway the code allows\n        there, such as metal conduit) where the code is adopted", gone: "(or be in a\n        raceway) where the code is adopted" },
  { id: "F089664", file: "src/screens/lab/calc/workspaces/loudness.ts", now: "inter-sample peaks often sit about 1 dB above the sample peaks, and 3 dB or more on some hot material;", gone: "inter-sample peaks can ride up to ~3 dB higher;" },
  { id: "F013577", file: "src/screens/lab/mastering/modules/mod6Loudness.tsx", now: "It watches only the samples, which is why TRUE PK can read over the ceiling. Most mastering limiters add look-ahead and true-peak detection (oversampling), often as a mode you switch on", gone: "Real mastering limiters use look-ahead and true-peak detection" },
  { id: "F089866", file: "src/screens/lab/calc/workspaces/powerElec.ts", now: "Every watt a rack draws that isn’t sent down speaker cables ends up as heat. Enter the total device ' +\n    'wattage (a safe high guess for amp racks) and read", gone: "Every watt a rack draws that isn’t leaving as sound leaves as heat. Enter the total device ' +\n    'wattage and read" },
  { id: "F090619", file: "src/screens/lab/calc/workspaces/splSafety.ts", now: "converts back — the right way ' +\n    'to combine independent (uncorrelated) sources.',", gone: "converts back — the only honest way ' +\n    'to combine sources.'," },
  { id: "F090826", file: "src/screens/lab/calc/workspaces/timePhase.ts", now: "Snare top and bottom mics, after the usual polarity flip on the bottom, still differ by 0.3 ms. At 200 Hz", gone: "Snare top and bottom mics differ by 0.3 ms. At 200 Hz" },
  { id: "F091039", file: "src/screens/lab/calc/workspaces/wavesAdv.ts", now: "The third-order products (2f₁−f₂ and 2f₂−f₁) are often the worst: with close tones they ' +\n    'fall right next to the originals, where you can’t filter them away.',", gone: "The third-order products (2f₁−f₂ and 2f₂−f₁) are the worst: they ' +\n    'fall right next to the original tones, where you can’t filter them away.'," },
  { id: "F009162", file: "src/screens/lab/cymatics/modules/modIntro.tsx", now: "PHASE VIEW · AMBER RISES WHILE VIOLET FALLS", gone: "PHASE VIEW · AMBER RISES WHILE BLUE FALLS" },
  { id: "F009019", file: "src/screens/lab/cymatics/MembraneStudioScreen.tsx", now: "— near 1 : 1.5 : 2 : 2.5, close to a harmonic series, so the ear hears a clear pitch.", gone: "— near 1 : 1.5 : 2 : 2.5, a harmonic series missing its fundamental, so the ear supplies a pitch." },
  { id: "F011132", file: "src/screens/lab/digital/modules/modDac.tsx", now: "the smooth analog waveform. In this\n            classic model the step→smooth handoff happens at the filter block; an oversampling DAC\n            does most of the smoothing earlier, in a digital filter.", gone: "the smooth analog waveform. The\n            step→smooth handoff happens at the filter block, nowhere else." },
  { id: "F011355", file: "src/screens/lab/drumtuning/drumContent.ts", now: "A drumhead\\'s overtones are not in simple ratios, so a tuner jumps between them; trust your ears", gone: "A drumhead\\'s overtones are not in simple ratios, so there is no single note to find; aim for a sound you like" },
  { id: "F010056", file: "src/screens/lab/dj/pages/p11Grid.tsx", now: "a thin line on every beat and a bold bar line", gone: "a thin line on every kick and a bold bar line" },
  { id: "F012976", file: "src/screens/lab/gain/modules/modLearn.tsx", now: "hiss you can’t cleanly remove", gone: "hiss you can never remove" },
  { id: "F013139", file: "src/screens/lab/mastering/masteringContent.ts", now: "explain: 'Bass behavior is set by the room dimensions and where the speakers and listener sit. Treatment and placement are the real fix; room-correction EQ can only tame a peak at one seat.", gone: "explain: 'Bass behavior is set by the room dimensions and the listening position. Treatment and placement address it; no plugin does." },
  { id: "F013935", file: "src/screens/lab/meter/modules/modMeterB.tsx", now: "EQ mostly moves the ridge up and down (level); across the room it keeps storing and releasing energy at 250 Hz. Only absorption — damping, treatment, bass trapping — shortens the DECAY for every seat.", gone: "EQ moves the ridge up and down (level); the room keeps storing and releasing energy at 250 Hz for just as long. Only absorption — damping, treatment, bass trapping — shortens the DECAY." },
  { id: "F014104", file: "src/screens/lab/meter/modules/modMeterC.tsx", now: "break the ground loop (one ground path, proper balanced connections, reroute cables away from power — never by lifting the mains safety earth).", gone: "break the ground loop (one ground path, proper balanced connections, reroute cables away from power)." },
  { id: "F014249", file: "src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx", now: "mono: 'Risky. Wide spacing means a sound reaches the two mics at different times, so summing can comb-filter it and leave it hollow.", gone: "mono: 'Risky. Wide spacing means one mic can be pushing while the other pulls, so summing can thin the low end." },
  { id: "F081106", file: "src/screens/lab/mixing/pagesAdvA.tsx", now: "perfect for level control that must not touch each channel’s own processing (though it does change the drive into a bus compressor downstream, and it also", gone: "perfect for level control that must not touch processing (and it also" },
  { id: "F084527", file: "src/screens/lab/roomdesign/bits.tsx", now: "85 dB(A) for eight hours is the NIOSH recommended limit and every +3 dB halves the safe time", gone: "85 dB(A) for eight hours is the occupational limit and every +3 dB halves the safe time" },
  { id: "F086314", file: "src/screens/lab/soundsystems/pagesLearnB.tsx", now: "and DOUBLES the minimum impedance (twice the per-channel minimum, often 8 Ω), so a load below the bridged minimum is the classic mistake.", gone: "and DOUBLES the minimum impedance (typically 8 Ω), so a bridged 4 Ω load is the classic mistake." },
  { id: "F086946", file: "src/screens/lab/tube/VacuumTubeLabScreen.tsx", now: "Most tube mic preamps, guitar amps, compressors and broadcast consoles repeat this one\n          picture, with other stages (like the cathode follower) mixed in.", gone: "Every tube mic preamp, guitar amp, compressor and broadcast console ever made is this one\n          picture, repeated." },
  { id: "F087756", file: "src/screens/lab/wave/modules/modWaveB.tsx", now: "Drag the listener: when a late reflection’s gap crosses ~50 ms its verdict flips,\n            while the nearest surface keeps answering within a few milliseconds.", gone: "Drag the listener: the gap to the first reflection crosses ~50 ms and its\n            verdict flips, while the far-wall return changes far less." },
  { id: "F000545", file: "src/screens/lab/foundations/FoundationsCourseScreen.tsx", now: "Sound is a pressure wave, usually in air. Not electricity.", gone: "Sound is moving air. Not electricity." },
  { id: "F000693", file: "src/screens/lab/foundations/FoundationsCourseScreen.tsx", now: "they set the sound’s character while the repeat rate (220 times a second) keeps the pitch.", gone: "they set the sound’s character while the fundamental keeps the pitch." },
  { id: "F012840", file: "src/screens/lab/fxLabConfigs.tsx", now: "A limiter is a compressor with a very high (here infinite) ratio: the ceiling caps the output — the flat ' +", gone: "A limiter is a compressor with an infinite ratio: NOTHING passes the ceiling — the flat ' +" },
  { id: "F086414", file: "src/screens/lab/soundsystems/pagesLearnC.tsx", now: "it takes off at the first frequency where the gain around the loop passes unity, in phase.", gone: "it takes off at the one frequency where the gain around the loop passes unity." },
];

for (const c of CASES) {
  test(`${c.id}: corrected wording in ${c.file}`, () => {
    const s = read(c.file);
    assert.ok(s.includes(c.now), `${c.id}: new wording missing`);
    assert.ok(!s.includes(c.gone), `${c.id}: old wording still present`);
  });
}

// Owner ruling 2026-10-22: comb filtering cancels FREQUENCIES, not pitches.
// Scope = this group: src/screens/lab outside miking/ and mixingGuides/.
test('no lab file in this group says comb filtering cancels "pitches"', () => {
  const lab = path.join(ROOT, 'src/screens/lab');
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = path.join(dir, n);
      if (statSync(p).isDirectory()) return n === 'miking' || n === 'mixingGuides' ? [] : walk(p);
      return /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
  const bad = /(pitches|notes) (cancel|drop out|vanish)|cancel[a-z]* (some |certain )?(pitches|notes)/i;
  const hits = walk(lab).filter((p) => bad.test(readFileSync(p, 'utf8').replace(/\r\n/g, '\n')));
  assert.deepEqual(hits, []);
});
