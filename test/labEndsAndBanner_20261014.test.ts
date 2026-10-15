/**
 * Owner rulings 2026-10-14:
 *   #20 Tuning START OVER clears the chapter marks (the progress display);
 *       the lab's banked credit stays (`done` sticky; the tr_tuning key lives
 *       in labCompletion and nothing here touches it).
 *   #21 Amplitude, Sound Playground and Signal Chain end on the shared
 *       what's-left screen (kit/ReviewLabEnd → LabEndScreen).
 *   #23 the NO SOUND FROM THE MICROPHONE card is a slim banner — the display
 *       below keeps running — with TRY AGAIN still wired.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-ends-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-ends-storage') {
      return { format: 'module', shortCircuit: true, source: 'export default { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };' };
    }
    return nextLoad(url, context);
  },
});

const { tuningResetForPractice } = await import('../src/features/tuning/tuningProgress.ts');
const { whatsLeft, endLead, reviewLabUnits, REVIEW_UNIT_ID } = await import('../src/screens/lab/kit/labEnd.ts');

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('#20 Tuning START OVER: chapter marks clear, credit stays', () => {
  it('tuningResetForPractice clears the marks and the place, keeps done and BASIC/MATH', () => {
    const r = tuningResetForPractice({ completed: [0, 1, 2, 3], lastChapter: 3, done: true, mathView: true }, 0);
    assert.deepEqual(r, { completed: [], lastChapter: 0, done: true, mathView: true });
    assert.equal(tuningResetForPractice({ completed: [1], lastChapter: 1, done: false, mathView: false }).done, false);
  });
  it('the screen runs it on START OVER, and `done` never falls back during practice', () => {
    const s = read('src/screens/lab/tuning/TuningLabScreen.tsx');
    assert.match(s, /if \(base\) persist\(tuningResetForPractice\(base, CHAPTERS\[0\]\.index\)\);/);
    assert.match(s, /confirmDialog\(\s*'Start a fresh practice run\?',[\s\S]{0,200}clears the chapter marks\. Credit you have already earned stays\.',\s*'Start over',\s*doReset,/);
    assert.match(s, /const done = base\.done \|\| completed\.length >= CHAPTER_COUNT;/);
    assert.match(s, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    // A credited lab says so on the end screen even with every mark cleared.
    assert.match(s, /extra=\{progress\?\.done && !unreadable \? <Text style=\{styles\.creditKept\}>This lab is already credited\./);
  });
});

describe('#21 the one-page review labs end on the what’s-left screen', () => {
  it('the one unit: left until reviewed, then credited', () => {
    const units = reviewLabUnits();
    assert.equal(units.length, 1);
    assert.equal(units[0].id, REVIEW_UNIT_ID);
    const left = whatsLeft(units, new Set());
    assert.equal(left.complete, false);
    assert.match(endLead(left, { mode: 'credit', noun: 'step' }), /^1 step of 1 still to finish before this lab counts toward your credit\./);
    assert.equal(whatsLeft(units, new Set([REVIEW_UNIT_ID])).complete, true);
  });
  it('ReviewLabEnd is the shared LabEndScreen, opened only by a tap, never blocking', () => {
    const k = read('src/screens/lab/kit/ReviewLabEnd.tsx');
    assert.match(k, /import \{ Modal \} from '\.\.\/\.\.\/\.\.\/components\/DimModal';/);
    assert.match(k, /<LabEndLink\s+onPress=\{\(\) => \{\s*onOpen\?\.\(\);\s*setOpen\(true\);/);
    assert.match(k, /<LabEndScreen[\s\S]*mode="credit"[\s\S]*onJump=\{close\}\s*onPracticeAgain=\{close\}/);
    assert.match(k, /extra=\{complete \|\| !offerReview \? undefined : <LabReviewButton labKey=\{labKey\} \/>\}/);
    assert.match(k, /runSoon\(\(\) => safeGoBack\(navigation\)\)/);
  });
  it('wired in all three labs', () => {
    assert.match(read('src/screens/lab/SignalChainLabScreen.tsx'), /<ReviewLabEnd labKey="af_signal_chain" labTitle="Signal Chain Builder" onOpen=\{stop\} \/>/);
    assert.match(read('src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx'), /<ReviewLabEnd labKey="af_sound_playground" labTitle="Sound Playground" onOpen=\{stop\} \/>/);
    // Amplitude's credit is its ramp check — the end screen points back to it.
    assert.match(read('src/screens/lab/amplitude/AmplitudeOrientation.tsx'), /<AmplitudeColorBody alsoReviewLab \/>\s*\{\/\*[\s\S]*?\*\/\}\s*<ReviewLabEnd\s+labKey="af_amplitude"[\s\S]*?offerReview=\{false\}/);
  });
});

describe('#23 NO SOUND FROM THE MICROPHONE is a banner over a running display', () => {
  const g = read('src/screens/tools/EngineGate.tsx');
  const block = g.slice(g.indexOf("if (state === 'running' && noSignal) {"), g.indexOf("if (state === 'idle' || state === 'starting' || state === 'running') return null;"));
  it('slim banner, TRY AGAIN beside the line, no tall card', () => {
    assert.match(block, /<View style=\{styles\.banner\}/);
    assert.doesNotMatch(block, /styles\.card/);
    assert.match(block, /the display keeps running/);
    assert.match(block, /<GlassButton label="TRY AGAIN"[^>]*onPress=\{onRetry\} \/>/);
  });
  it('no mic tool hides its display behind the verdict', () => {
    for (const t of ['SplMeter', 'Spectrogram', 'Rta', 'MultiMeter', 'Waveform']) {
      const s = read(`src/screens/tools/${t}Screen.tsx`);
      assert.doesNotMatch(s, /noSignal \? null|!noSignal &&|noSignal \?\s*<EngineGate[^>]*\/>\s*:/, `${t}: the display must stay up`);
    }
  });
});
