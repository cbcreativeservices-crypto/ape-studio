/**
 * Fact-audit fix pass, Round 1, group C_other (2026-10-22): Computer B's
 * fact-check return, S1 items across calculators, metering, guided lessons,
 * cymatics, cable, envelope, speech, mixing guides, FM and the SPL meter.
 * Each fix is pinned so the wrong claim cannot come back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
// CRLF normalised, then whitespace collapsed so JSX text that wraps across
// source lines reads as one sentence.
const read = (rel: string) =>
  readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ');

const FOUND = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
const CONTENT = read('src/features/lab/guidedLessons/content.ts');
const HELP = read('src/features/lab/guidedLessons/toolHelp.tsx');
const CABLE = read('src/screens/lab/cable/data/connectors.recognition.ts');
const HARM = read('src/screens/lab/cymatics/modules/modHarmony.tsx');
const SYS = read('src/screens/lab/cymatics/modules/modSystems.tsx');
const DAC = read('src/screens/lab/digital/modules/modDac.tsx');
const ENV = read('src/screens/lab/envelope/EnvelopeLabScreen.tsx');
const MB = read('src/screens/lab/meter/modules/modMeterB.tsx');
const JAZZ = read('src/screens/lab/mixingGuides/data/guides/g21-jazz.ts');
const FOLK = read('src/screens/lab/mixingGuides/data/guides/g34-folk-singer-songwriter.ts');
const STAGE7 = read('src/features/production/postprod/stage7.data.ts');
const FM = read('src/screens/lab/FmLabScreen.tsx');
const SSB = read('src/screens/lab/soundsystems/pagesLearnB.tsx');
const SPEECH = read('src/features/speech/speechModel.ts');
const SPL = read('src/screens/tools/SplMeterScreen.tsx');
const LEVELS = read('src/screens/lab/calc/workspaces/levels.ts');
const SPK = read('src/screens/lab/calc/workspaces/speakers.ts');

describe('F000572: louder = FARTHER; the wrong option is a higher RATE, not "faster"', () => {
  it('the option, hint and reveal say MORE OFTEN', () => {
    assert.ok(FOUND.includes("'Move back and forth MORE OFTEN each second',"));
    assert.ok(!FOUND.includes("'Move back and forth FASTER',"));
    assert.ok(FOUND.includes('how OFTEN it moves, or how FAR?'));
    assert.ok(!FOUND.includes('how FAST it moves, or how FAR?'));
    assert.ok(!FOUND.includes('Moving FASTER changes how often'));
    assert.ok(FOUND.includes('Amplitude is the SIZE of the vibration, not its rate.'));
  });
});

describe('F002090 / F002107 / F002113: cymatics glossary physics', () => {
  it('more surface tension makes the waves longer', () => {
    assert.ok(CONTENT.includes('more surface tension makes the waves longer at the same drive frequency'));
    assert.ok(!CONTENT.includes('surface tension shortens the wavelength'));
  });
  it('below f_s the cone keeps moving; its output falls', () => {
    assert.ok(CONTENT.includes('it moves about the same amount, but its sound output falls fast; near f_s the motion peaks if damping is low'));
    assert.ok(!CONTENT.includes('stiffness-controlled and barely moves'));
  });
  it('cork dust marks where the air does not move, not pressure nodes', () => {
    assert.ok(CONTENT.includes('a pipe’s still air (cork dust gathers where the air does not move)'));
    assert.ok(!CONTENT.includes('a pipe’s pressure nodes (cork dust, a flame)'));
  });
});

describe('F002193 / F002200: spectrogram dB range (top anchored at the observed max)', () => {
  it('a WIDE range reaches the faint detail; too NARROW hides it', () => {
    assert.ok(HELP.includes('A wide range reaches down to faint detail (and more noise); a narrow range shows only the strongest content.'));
    assert.ok(!HELP.includes('A narrow range shows faint detail'));
    assert.ok(HELP.includes('Too narrow a dB range hides the interesting quiet detail (reflections, tails); widen it to reveal them.'));
    assert.ok(!HELP.includes('Too wide a dB range hides'));
  });
});

describe('F005078: a DMX/audio mismatch can damage gear (phantom power)', () => {
  it('names the phantom risk and drops "not equipment damage"', () => {
    assert.ok(CABLE.includes('+48 V phantom power from a mic input can damage a DMX port'));
    assert.ok(!CABLE.includes('protocol and impedance incompatibility, not equipment damage'));
  });
});

describe('F009150: two pure sines have no partials to beat', () => {
  it('describes the secondary beat, not loud/silent partial cancellation', () => {
    assert.ok(HARM.includes('Two pure sines have no extra partials to line up.'));
    assert.ok(HARM.includes('You hear a faint, slow throb, not loud then silent.'));
    assert.ok(!HARM.includes('loud where they agree, silent where they cancel'));
  });
});

describe('F009234: beads hang at pressure nodes, where the air moves most', () => {
  it('splits plate stillness from levitation pressure nodes', () => {
    assert.ok(SYS.includes('beads hang where the air pressure barely changes, which is where the air itself moves the most'));
    assert.ok(!SYS.includes('where the medium stands still, sand rests, beads hang, a flame is quiet'));
  });
});

describe('F011163: 6.02N + 1.76 is the UNDITHERED SNR', () => {
  it('stays undithered, with dither about 4.8 dB lower', () => {
    assert.ok(DAC.includes('the theoretical SNR for an UNDITHERED full-scale sine'));
    assert.ok(!DAC.includes('the theoretical SNR for a dithered full-scale sine'));
  });
});

describe('F012559: a FAST, heavy compressor smears onsets', () => {
  it('no longer blames a slow compressor', () => {
    assert.ok(ENV.includes('Squash or smear the onsets — a fast, heavy compressor, a boomy room — and the words run together.'));
    assert.ok(!ENV.includes('Smear the onsets — a slow compressor'));
  });
});

describe('F013922 / F013926 / F013927: waterfall time runs back (t = 0) to front', () => {
  it('the quiz agrees with the axis label', () => {
    assert.ok(MB.includes("'TIME — each ridge nearer the front is the spectrum a moment later',"));
    assert.ok(MB.includes('The back edge is the start (t = 0)'));
    assert.ok(MB.includes("v: 'time (t=0 at back)'"));
    assert.ok(!MB.includes('each ridge behind the front is the spectrum a moment later'));
    assert.ok(!MB.includes('Z = time receding'));
    assert.ok(!MB.includes('LINGERS far behind its neighbors'));
  });
});

describe('F077824 / F079130: mixing-guide facts', () => {
  it('the jazz reference names a real track on the album', () => {
    assert.ok(JAZZ.includes('Cécile McLorin Salvant, “Wild Women Don’t Have the Blues” (Dreams and Daggers), 2017'));
    assert.ok(!JAZZ.includes('“Dreams and Daggers” (Dreams and Daggers)'));
  });
  it('folk wedges aim INTO the mic null', () => {
    assert.ok(FOLK.includes('Wedges low and aimed into each mic’s null (its rejection angle)'));
    assert.ok(!FOLK.includes('well away from mic rejection angles'));
  });
});

describe('F083261: turning down alone does not restore loudness range', () => {
  it('the fix backs off the limiting first', () => {
    assert.ok(STAGE7.includes('The fix was to back off the limiting and compression'));
    assert.ok(!STAGE7.includes('The fix was gain, downward, which costs nothing and gives the dynamics back.'));
  });
});

describe('F084854: FM 3.5 is a half-integer (harmonic, sparse) ratio', () => {
  it('3.5 is no longer called inharmonic or marked irrational', () => {
    assert.ok(FM.includes("{ v: 3.5, label: '3.5', blurb: 'A half-integer ratio:"));
    assert.ok(!FM.includes("label: '3.5 ✳'"));
    assert.ok(!FM.includes('Another inharmonic ratio: clangorous'));
    assert.ok(FM.includes("'An irrational ratio like 1.41 (√2)',"));
    assert.ok(!FM.includes('Non-integer ratios (√2, 3.5) drop them BETWEEN'));
  });
});

describe('F086237: end-fire delays the FRONT box', () => {
  it('the rear box is the reference', () => {
    assert.ok(SSB.includes('the FRONT box delayed by the time sound takes to travel from the rear box to it'));
    assert.ok(!SSB.includes('the rear box delayed by the time sound takes to reach the front one'));
  });
});

describe('F086703 / F086753: muffling hurts S and F first, not nasals', () => {
  it('both nasal lines are corrected', () => {
    assert.ok(SPEECH.includes('so muffling changes them little; S, F and TH are the sounds that fade first.'));
    assert.ok(SPEECH.includes('That is why a muffled recording hurts S and F far more than M and N.'));
    assert.ok(!SPEECH.includes('first sounds to vanish in a muffled recording'));
  });
});

describe('F088672: hearing risk starts near 85, not 96', () => {
  it('the SPL legend states the 85 / 3 dB rule', () => {
    assert.ok(SPL.includes('Hearing risk starts near 85 over a full day, and the safe time halves with every 3 dB more'));
    assert.ok(!SPL.includes('the point where sustained levels get into hearing-risk territory'));
  });
});

describe('F089424: a decibel is a tenth of a bel', () => {
  it('no longer says ten bels', () => {
    assert.ok(LEVELS.includes('a decibel is a tenth of a bel, and the bel is the log of a power ratio'));
    assert.ok(!LEVELS.includes('ten bels of power ratio'));
  });
});

describe('F090311: loudspeaker measurements are IEC 60268-5', () => {
  it('speakers workspace cites part 5', () => {
    assert.ok(SPK.includes('IEC 60268-5 governs the'));
    assert.ok(!SPK.includes('IEC 60268-4 governs the'));
  });
});
