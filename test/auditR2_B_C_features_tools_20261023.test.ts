// Round-2 audit fix pass, ROUND B (the last round), group C_features_tools (2026-10-23):
// pins every Round B text fix (new wording present, old wording gone), the dev-text
// rule for learners, the "qualified" rule, and the regenerated lab-cert seed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(import.meta.dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');

const CASES: { id: string; file: string; now: string; gone: string | null }[] = [
  {"id": "R000227", "file": "src/features/lab/guidedLessons/content.ts", "now": "folds back to |f − k·fs|, where k is the whole number nearest f/fs (between fs/2 and fs, that is fs − f).", "gone": "folds back to |f − k·fs| (between fs/2 and fs, that is fs − f)."},
  {"id": "R000245", "file": "src/features/lab/guidedLessons/content.ts", "now": "SNR (dB) = 20·log₁₀(signal RMS ÷ noise RMS), an amplitude ratio (use 10·log₁₀ for a power ratio).", "gone": "SNR (dB) = 20·log₁₀(signal/noise)."},
  {"id": "R000252", "file": "src/features/lab/guidedLessons/content.ts", "now": "Anything flipped in one channel but not the other cancels, and anything delayed between channels combs here, which is exactly what a mono listener hears.", "gone": "Anything with inverted polarity cancels and anything delayed combs here, which is exactly what a mono listener hears."},
  {"id": "R000279", "file": "src/features/lab/guidedLessons/content.ts", "now": "It shows how much headroom the peaks need above the RMS level, which is only a rough guide to loudness.", "gone": "It shows how much headroom the peaks demand versus the perceived loudness."},
  {"id": "R000306", "file": "src/features/lab/guidedLessons/content.ts", "now": "as long as the modulator is a whole-number multiple of the carrier, the perceived pitch stays at the carrier.", "gone": "with whole-number ratios the perceived pitch stays at the carrier."},
  {"id": "R000391", "file": "src/features/lab/guidedLessons/content.ts", "now": "Thinking a low note sounds as loud as a high one at the same level — low bass notes need MORE energy to sound equally loud;", "gone": "Assuming louder = lower — low bass notes need MORE energy to hear at equal loudness;"},
  {"id": "R000433", "file": "src/features/lab/guidedLessons/content.ts", "now": "broadband content feeds timing cues in the lows and level cues in the highs at the same time.", "gone": "broadband content feeds BOTH cues at every frequency."},
  {"id": "R000436", "file": "src/features/lab/guidedLessons/content.ts", "now": "Localization changes with frequency: LOW tones are located mainly by ITD (timing between the ears), HIGH tones by ILD (the head shadows the far ear). For a steady tone, timing works only up to about 800 Hz: with a top ITD near 0.66 ms, the two ears are 180° apart at about 760 Hz. Above that the timing cue gets confused, and a pure tone is hardest to place around 1.5–2 kHz, before the head shadow takes over. A pure tone also lacks onsets and spectral detail — switch it to noise to hear the difference.", "gone": "Localization changes with frequency: LOW tones are located mainly by ITD (timing between the ears), HIGH tones by ILD (the head shadows the far ear). ~800 Hz is an UPPER bound, not a lower one: with a maximum ITD near 0.66 ms the interaural phase reaches 180° around 760 Hz, so ABOVE that a steady tone’s timing cue turns ambiguous and pure-tone localization is worst around 1.5–2 kHz, before the head shadow takes over. What a pure tone lacks is onsets and spectral detail — switch it to noise to hear the difference."},
  {"id": "R000492", "file": "src/features/lab/guidedLessons/content.ts", "now": "How peaked the corner is. Higher Q rings and boosts right at the cutoff; lower Q bends in more gently. The slope past the corner stays the same — the filter’s order sets that.", "gone": "How sharp the cutoff is. Higher Q rings and emphasizes right at the corner; lower Q rolls off gently."},
  {"id": "R000502", "file": "src/features/lab/guidedLessons/content.ts", "now": "The audio demo uses two REAL tones: locked at 220 / 220 Hz they simply add; 2 Hz apart (220 / 222 Hz) their offset keeps sliding, and the slow beating you hear is that offset cycling from 0° to 180° and back.", "gone": "The audio demo uses two REAL tones — their audible slow beating is phase alignment cycling."},
  {"id": "R000510", "file": "src/features/lab/guidedLessons/content.ts", "now": "A cone that moves farther is louder; one that moves back and forth more times per second is higher.", "gone": "A cone moving farther is louder; moving faster is higher."},
  {"id": "R000523", "file": "src/features/lab/guidedLessons/content.ts", "now": "A true omni is a pure pressure mic: no ports, no gradient, no proximity effect. (A multi-pattern mic set to omni can still show a little.)", "gone": "Omnis are pure pressure mics: no ports, no gradient, no proximity effect."},
  {"id": "R000627", "file": "src/features/lab/guidedLessons/content.ts", "now": "Sample number 24,001 holds 12,486 = 0011000011000110", "gone": "Sample 24,001 = 12,486 = 0011000011000110"},
  {"id": "R000699", "file": "src/features/lab/guidedLessons/content.ts", "now": "Height = amplitude, flat tops = clipping, flat line = silence, sharp spikes = transients. A lopsided shape is normal for voice and brass; a whole wave riding off the center line is not.", "gone": "Height = amplitude, symmetry = polarity balance, flat tops = clipping, flat line = silence, sharp spikes = transients."},
  {"id": "R000770", "file": "src/features/lab/guidedLessons/content.ts", "now": "the linear plate adds both responses together. Where the device can play both tones you hear the sum; otherwise it is shown but not heard.", "gone": "the linear plate superposes both responses. Heard as a true two-tone sum on engine 8; shown only on earlier builds."},
  {"id": "R000770b", "file": "src/features/lab/guidedLessons/content.ts", "now": "(played by the additive engine where the device supports it)", "gone": "(played by the additive engine on engine ≥ 3)"},
  {"id": "R000770c", "file": "src/features/lab/guidedLessons/content.ts", "now": "for quiet rooms and devices that cannot play the tone.", "gone": "for quiet rooms and clients without the audio engine."},
  {"id": "R000770d", "file": "src/features/lab/guidedLessons/content.ts", "now": "Two-frequency forcing is how the quasiperiodic “superlattice” patterns were discovered (Edwards & Fauve). Where the device can play both tones you hear the sum; otherwise it is shown but not heard.", "gone": "Two-frequency forcing is how the quasiperiodic “superlattice” patterns were discovered (Edwards & Fauve). Heard as a true two-tone sum on engine 8; shown only on earlier builds."},
  {"id": "R000770e", "file": "src/features/lab/guidedLessons/content.ts", "now": "Options this device cannot run are turned off.", "gone": "Controls without a native half are disabled on this device."},
  {"id": "R000771", "file": "src/features/lab/guidedLessons/content.ts", "now": "Finer, lighter sand resolves finer figures, up to a point: very fine powder is carried by air currents to the moving areas instead. Friction slows migration.", "gone": "Finer, lighter sand resolves finer figures; friction slows migration."},
  {"id": "R000802", "file": "src/features/lab/guidedLessons/content.ts", "now": "Zero beats is how a piano tuner hears that two strings agree. On some devices this is shown but not heard.", "gone": "Zero beats is how a tuner knows two strings are in tune. Shown only on builds whose engine plays one locked pair at a time."},
  {"id": "R000856", "file": "src/data/labRequirements.ts", "now": "Flute sounds mostly from the hole the player blows across and the open finger holes,", "gone": "Flute sounds mostly from the mouthpiece and the open holes,"},
  {"id": "R000857", "file": "src/data/labRequirements.ts", "now": "Clarinet sounds mostly from its finger holes, not its bell. Aiming only at the bell is the most common miking mistake on it.", "gone": "Clarinet sounds mostly from its finger holes, not its bell — the most common miking mistake on the instrument."},
  {"id": "R000898", "file": "src/data/labRequirements.ts", "now": "Pre- and post-fader sends decide whether an effect follows the fader — and whether a route sends the same sound twice by mistake.", "gone": "Pre- and post-fader sends decide whether an effect follows the fader — and when a route accidentally doubles."},
  {"id": "R000929", "file": "src/data/labRequirements.ts", "now": "Restoration is mostly filtering. The skill is knowing when a filter takes out the recording along with the noise.", "gone": "Restoration is mostly filtering, and knowing when a filter is removing the recording along with the noise."},
  {"id": "R001089", "file": "src/data/labRequirements.ts", "now": "Restoration is filtering. The skill is knowing when a filter is harming the record.", "gone": "Restoration is filtering, and knowing when a filter is destroying the record."},
  {"id": "R000982", "file": "src/data/labRequirements.ts", "now": "Enhancement is filtering. The skill is knowing when a filter takes out evidence along with the noise.", "gone": "Enhancement is filtering — and knowing when a filter is removing evidence along with the noise."},
  {"id": "R001000", "file": "src/data/labRequirements.ts", "now": "Aligning subs to tops and the main speakers to the delay speakers is phase work.", "gone": "Aligning subs to tops and the deck to the delays is phase work."},
  {"id": "R001067", "file": "src/data/labRequirements.ts", "now": "Out-of-phase bass makes the groove depth swing too far to cut or play safely — mono compatibility is a physical limit here, not a preference.", "gone": "Out-of-phase bass will not cut — mono compatibility is a physical limit here, not a preference."},
  {"id": "R000985", "file": "src/data/labRequirements.ts", "now": "Game audio places sound objects around the player. On headphones, they are heard through binaural rendering.", "gone": "Game audio places sound objects around the player, and that is how they are heard on headphones."},
  {"id": "R005130", "file": "src/features/lab/understandingChecks.ts", "now": "Pink noise puts the same energy in each octave, so it sounds even from bottom to top. It also reads flat on an octave or 1/3-octave analyzer, the way rooms and speakers are measured.',", "gone": "Pink noise puts the same energy in each octave, so it sounds even from bottom to top.',"},
  {"id": "R009993", "file": "src/features/soundsystems/faults.ts", "now": "at 400 Hz, the vocals and much of the music go to the subwoofers.", "gone": "400 Hz sends most of the music to the subwoofers."},
  {"id": "R010548", "file": "src/features/tools/learn/concepts.ts", "now": "'Noise and unsteady conditions can lower coherence before you hear any change.',", "gone": "'Noisy or unstable conditions lower measurement reliability before they change the sound.',"},
  {"id": "R010577", "file": "src/features/tools/learn/concepts.ts", "now": "in many rooms low frequencies ring longer than highs,", "gone": "low frequencies commonly ring far longer than highs,"},
  {"id": "R020838", "file": "src/screens/tools/SignalGenScreen.tsx", "now": "(each octave is twice as wide in Hz as the one below)", "gone": "(each octave holds twice the frequencies)"},
  {"id": "R020854", "file": "src/screens/tools/SignalGenScreen.tsx", "now": "FINE — ±1 SEMITONE (×2^(1/12))", "gone": "FINE — ±1 SEMITONE (×2^1/12)"},
  {"id": "R021683", "file": "src/features/soundsystems/console.ts", "now": "One button that mutes a set of channels at once — say, all the band mics between songs.", "gone": "One button that mutes a set of channels together — band off, walk-in music on, between songs."},
  {"id": "R021707", "file": "src/features/soundsystems/console.ts", "now": "A subgroup is a summed path, not a send: the vocals would need routing to it as well as to the main, and each vocal would lose its own reverb amount. A post-fader aux does this job.", "gone": "A subgroup would send the whole vocal path into the reverb — no dry signal left to balance against."},
  {"id": "R021944", "file": "src/features/production/postprod/stage6.data.ts", "now": "Usually speech intelligibility, almost everywhere. Say so if it is, and name any places where something else comes first.", "gone": "Usually speech intelligibility, everywhere, without exception. Say so if it is, and say what the exceptions are if there are any."},
  {"id": "R022022", "file": "src/features/production/postprod/stage6.data.ts", "now": "Every effect send needs a return that reaches the master and the stems.", "gone": "Every send needs a return that reaches the master and the stems."},
  {"id": "R022339", "file": "src/features/intro/labTermIntroData.ts", "now": "Their frequencies are whole-number multiples of the main note's frequency.", "gone": "Their pitches are simple multiples of that main pitch."},
  {"id": "R022336", "file": "src/features/intro/labTermIntroData.ts", "now": "When two equal sine waves are half a cycle apart (180 degrees) they cancel.", "gone": "When one is half a cycle behind (180 degrees) they cancel."},
  {"id": "R032801", "file": "src/features/soundsystems/capstones.ts", "now": "— with more mixes than its two channels, a top and a sub end up sharing one channel, with no crossover split between them.", "gone": "— on a two-channel amplifier that puts a top and a sub on one channel, with no crossover split between them."},
  {"id": "R035282", "file": "src/features/production/postprod/stage7.data.ts", "now": "Peaks between samples can already be in the master, and encoding", "gone": "Peaks between samples are already in the master, and encoding"},
  {"id": "R035378", "file": "src/features/production/postprod/stage7.data.ts", "now": "Back off the compression or limiting, then meet the target with overall gain.", "gone": "Take overall gain off instead and let the target be met at a lower level."},
  {"id": "R035390", "file": "src/features/production/postprod/stage7.data.ts", "now": "Reduce the bit depth only once, at the end of the chain, and apply dither at that one point.", "gone": "Apply it once, at the last point where the bit depth is reduced, and nowhere else."},
  {"id": "R037760", "file": "src/features/production/postprod/stage5.data.ts", "now": "Corrected material often comes back at a slightly different level and a little tidier, and either can read as better on its own.", "gone": "Corrected material is often a little louder and a little tidier, and both of those read as better on their own."},
  {"id": "R038678", "file": "src/features/startHere/startHereContent.ts", "now": "everything after the break loses it. The listener hears only the source itself, unamplified: your voice, or the small test-tone speaker.", "gone": "everything after the break loses it. The listener hears only the singer’s own, unamplified voice."},
  {"id": "R038679", "file": "src/features/startHere/startHereContent.ts", "now": "but nothing reaches the speaker. The listener hears only the source itself, unamplified: your voice, or the small test-tone speaker.", "gone": "but nothing reaches the speaker. The listener hears only the singer’s unamplified voice."},
  {"id": "R038783", "file": "src/features/startHere/startHereContent.ts", "now": "Choose the sound you will follow through all five steps.", "gone": "Choose the sound you will follow through the next five steps."},
  {"id": "R042235", "file": "src/features/soundsystems/loads.ts", "now": "a higher load is safe; it just delivers less power to the speakers.`", "gone": "a higher load is safe; it just draws less power.`"},
  {"id": "R042602", "file": "src/features/ear/modules/defects.ts", "now": "RF pickup (emulation) — a buzz that pulses on and off as radio bursts leak into the audio, the old GSM-near-a-cable sound.", "gone": "RF pickup (emulation) — pulsed bursts of a buzzy carrier, the old GSM-near-a-cable sound."},
  {"id": "R042613", "file": "src/features/ear/modules/defects.ts", "now": "' (The music bed is a stand-in made by the app.)'", "gone": "' (The bed is a rendered surrogate.)'"},
  {"id": "R046658", "file": "src/features/cymatics/presets.ts", "now": "tap ‹ −0.1 % about ten times and it returns barely 1 % lower", "gone": "tap ‹ −0.1 % a few times and it returns barely 1 % lower"},
  {"id": "R048246", "file": "src/features/tools/learn/spl.ts", "now": "On bass-heavy music, A-weighting can read 10 to 20 dB or more below C-weighting, because it discards most low-frequency energy.", "gone": "A-weighting can read tens of dB below C-weighting on bass-heavy material because it discards most low-frequency energy."},
  {"id": "R048578", "file": "src/features/ear/modules/time.ts", "now": "emulation’s set of delay lines.`", "gone": "emulation’s comb set.`"},
  {"id": "R049150", "file": "src/features/startHere/startHereGlossary.ts", "now": "Essential to recording any acoustic sound.'", "gone": "Essential to all audio recording.'"},
  {"id": "R049529", "file": "src/features/cymatics/membrane.ts", "now": "rigid low, cone flexing in the upper mids, breakup in the presence region.", "gone": "rigid low, cone flexing by the mid-treble, breakup in the presence region."},
  {"id": "R049539", "file": "src/features/cymatics/membrane.ts", "now": "(Q_ts ${driver.qts} says how sharp this peak is).", "gone": "(Q_ts ${driver.qts})."},
  {"id": "R049588", "file": "src/features/production/postprod/stage3.data.ts", "now": "Moving or fading one of these alone breaks the phase relationship that makes them sound like one thing.", "gone": "Editing one of these alone breaks the phase relationship that makes them sound like one thing."},
  {"id": "R049957", "file": "src/features/production/preprod/stage2.data.ts", "now": "Most publishing destinations set a loudness and peak requirement or target, and the numbers differ from one to the next.", "gone": "Most publishing destinations have a loudness and peak requirement or target, and they are not the same."},
  {"id": "R052307", "file": "src/features/tools/learn/waveform.ts", "now": "the outline of many samples (often many cycles) packed into each pixel column.", "gone": "the outline of thousands of cycles per second compressed into each pixel column."},
  {"id": "R055007", "file": "src/features/envelope/envelopeModel.ts", "now": "'No true sustain — the pedal only lets that decay keep going after the key comes up'", "gone": "'No true sustain — the pedal only lets that decay run longer'"},
  {"id": "R056946", "file": "src/features/soundsystems/gear.ts", "now": "On most larger shows the RF rack lives side-stage; on a small show it may sit at front of house.", "gone": "The RF rack lives side-stage on any real show."},
  {"id": "R057095", "file": "src/features/soundsystems/system.ts", "now": "MIC LEVEL — roughly 40–60 dB below line level, about 100 to 1,000 times smaller in voltage, too small", "gone": "MIC LEVEL — roughly 40–60 dB, hundreds of times in voltage, too small"},
  {"id": "R057096", "file": "src/features/soundsystems/system.ts", "now": "Line level is far too weak to drive a cone.", "gone": "Line level moves no cone."},
  {"id": "R057444", "file": "src/components/AccuracyNote.tsx", "now": "must be designed and approved by people qualified for that work, and licensed where the law requires it.", "gone": "must be designed and approved by people licensed or certified for that work."},
  {"id": "R057615", "file": "src/features/tools/learn/rta.ts", "now": "presence (~2–6 kHz), brilliance (~6–10 kHz), and air (~10 kHz up).", "gone": "presence (~2–6 kHz), and air (~6 kHz up)."},
  {"id": "R057801", "file": "src/screens/tools/RtaScreen.tsx", "now": "a11yLabel=\"High resolution — finer detail in the low bands, slower response\"", "gone": "a11yLabel=\"High resolution — reveals lower frequencies, slower response\""},
  {"id": "R057724", "file": "src/features/tools/tuner/centerLock.ts", "now": "'G2 D3 A3 D4 · low two often in octave pairs'", "gone": "'G2 D3 A3 D4 · octave pairs on the low two'"},
  {"id": "R058241", "file": "src/features/ear/modules/dynamics.ts", "now": "Hard clipping sprays new distortion products across the spectrum, most visibly at the top.", "gone": "Hard clipping sprays new distortion product right across the top of the spectrum."},
  {"id": "R058252", "file": "src/features/ear/modules/tone.ts", "now": "playbackNote: 'Phone speakers lose most of the low end: 63–80 Hz is absent, and tones up to about 200 Hz are weak. Use headphones, volume turned down first, for the low trials.',", "gone": "playbackNote: '63–80 Hz is genuinely absent on phone speakers.',"},
  {"id": "R059820", "file": "src/features/production/postprod/logic2.ts", "now": "label: 'Caption timing is verified against the final master and across the series'", "gone": "label: 'Caption timing is verified against the final master and the series compared across'"},
  {"id": "R060339", "file": "src/features/production/preprod/stage6.data.ts", "now": "hz_control: \"Monitor engineer holds levels; ear protection offered on stage and at the desk\"", "gone": "hz_control: \"Monitor engineer holds levels; ear protection at the desk\""},
];

for (const c of CASES) {
  test(`${c.id}: ${c.file} carries the Round B wording`, () => {
    const s = read(c.file);
    assert.ok(s.includes(c.now), `${c.id}: new wording missing`);
    if (c.gone) assert.ok(!s.includes(c.gone), `${c.id}: old wording still present`);
  });
}

test('guided lessons: no engine/build/client notes reach learners', () => {
  const s = read('src/features/lab/guidedLessons/content.ts');
  for (const bad of ['engine 8', 'earlier builds', 'engine ≥ 3', 'clients without the audio engine', 'native half', 'builds whose engine']) {
    assert.ok(!s.includes(bad), bad);
  }
});

test('AccuracyNote: rigging/power sign-off says qualified, never certified', () => {
  const s = read('src/components/AccuracyNote.tsx');
  assert.ok(!/licensed or certified/.test(s));
  assert.ok(s.includes('people qualified for that work'));
});

test('labRequirements Round B edits are mirrored in the generated seed SQL', () => {
  const sql = read('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql');
  assert.ok(sql.includes('the hole the player blows across'));
  assert.ok(sql.includes('Aiming only at the bell is the most common miking mistake on it.'));
  assert.ok(sql.includes('the main speakers to the delay speakers'));
  assert.ok(!sql.includes('the deck to the delays'));
  assert.ok(!sql.includes('Flute sounds mostly from the mouthpiece'));
});
