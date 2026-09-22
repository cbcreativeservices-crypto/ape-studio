/**
 * No live display without a live capture — the VISUALS, not just the numbers.
 *
 * ⛔ WHAT THIS PINS. `running` and "the mic is actually delivering audio" are
 * different questions. `getMeterFrame()` never returns null on an engine
 * build, so a stopped or stalled capture keeps delivering frames marked
 * `running:false` / `captureStalled:true`. That is the entire reason
 * `frameIsLive()` exists.
 *
 * It was applied to `frames.meter` — the numeric readouts — and to nothing
 * else. Every VISUAL frame stayed gated on `running` alone, so on a dead mic:
 *
 *   • the RTA drew a full spectrum beside a blanked LEVEL cell
 *   • the spectrogram minted a NEW column every 125 ms from the last spectrum
 *     the engine produced, scrolling convincingly — and those columns saved
 *   • the oscilloscope kept its trace, badged LIVE
 *   • both tuners went on reading STABLE
 *
 * The numbers told the truth and the pictures lied, which is the wrong way
 * round: the picture is what gets believed at a glance. A pass on 2026-09-20
 * fixed the meter frame and was recorded as "all seven tools stop showing a
 * dead mic"; it had covered one frame, not the screens.
 *
 * These pin the IDIOM rather than the six instances, because the next tool
 * added will reach for `running ?` just as naturally.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const TOOL_SCREENS = [
  'FrequencyCounterScreen',
  'MultiMeterScreen',
  'RtaScreen',
  'SpectrogramScreen',
  'WaveformScreen',
];

/** Comments explain the rule using the very text we search for. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const read = (name: string) =>
  stripComments(readFileSync(new URL(`../src/screens/tools/${name}.tsx`, import.meta.url), 'utf8'));

/** The visual frames. `meter` is excluded — it is the one already guarded. */
const VISUAL_FRAMES = ['pitch', 'bands', 'waveform', 'spectrum'];

test('no visual frame is gated on `running` alone', () => {
  const offenders: string[] = [];
  for (const name of TOOL_SCREENS) {
    const src = read(name);
    for (const frame of VISUAL_FRAMES) {
      // `running ? frames.pitch` and `state === 'running' ? frames.bands`
      const bad = new RegExp(`(?:state\\s*===\\s*'running'|\\brunning)\\s*\\?\\s*frames\\.${frame}\\b`);
      if (bad.test(src)) offenders.push(`${name}: frames.${frame}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'these draw from a frame on `running` alone, which stays true through a stalled capture:\n' +
      offenders.join('\n'),
  );
});

test('every tool screen with visuals knows about frameIsLive', () => {
  for (const name of TOOL_SCREENS) {
    assert.match(
      read(name),
      /frameIsLive/,
      `${name} draws live data but never asks whether the capture is live`,
    );
  }
});

test('the spectrogram checks liveness before pushing a column', () => {
  // It runs its OWN 8 Hz timer and reads the spectrum directly, so it cannot
  // rely on the hook's gating the way the other screens do.
  const src = read('SpectrogramScreen');
  const poll = src.slice(src.indexOf('setInterval'), src.indexOf('SPECTRO_POLL_MS)'));
  assert.match(
    poll,
    /captureLiveRef\.current/,
    'the 125 ms column push must skip on a dead mic, or it fabricates scrollable, savable history',
  );
});

test('frameIsLive still means what these tests assume', () => {
  // If the verdict itself is ever loosened, every guard above becomes a lie.
  const src = readFileSync(
    new URL('../src/features/tools/engine/useDspEngine.ts', import.meta.url),
    'utf8',
  );
  const fn = src.slice(src.indexOf('export function frameIsLive'));
  assert.match(fn.slice(0, 200), /m\.running\s*&&\s*!m\.captureStalled/, 'liveness = running AND not stalled');
});
