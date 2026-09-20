/**
 * The Sound Safety gate and the output ceiling.
 *
 * These test the two things that must never regress quietly: that the
 * acknowledgment is a RECORD rather than a boolean, and that file playback
 * cannot exceed its ceiling. Both protect a user's hearing, so both are worth
 * a test that fails loudly.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
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

const { PLAYBACK_CEILING, PLAYBACK_CEILING_DB, playbackVolume, applyCeiling } = await import(
  '../src/features/audio/outputCeiling.ts'
);
const {
  SOUND_SAFETY_ACK,
  SOUND_SAFETY_STEPS,
  SOUND_SAFETY_PROTECTIONS,
  soundSafetyFullText,
} = await import('../src/features/audio/soundSafetyText.ts');

describe('the file-playback output ceiling', () => {
  it('is 12 dB below full scale, as a linear amplitude', () => {
    assert.equal(PLAYBACK_CEILING_DB, -12);
    assert.ok(Math.abs(PLAYBACK_CEILING - 0.251188) < 1e-5, String(PLAYBACK_CEILING));
    assert.ok(PLAYBACK_CEILING < 1, 'a ceiling at or above full scale is not a ceiling');
  });

  it('can only ever attenuate — a caller cannot ask for more than the ceiling', () => {
    // The whole value of a ceiling is that no call site can raise it. If a lab
    // one day passes a gain instead of a fraction, it must be clamped, not obeyed.
    assert.equal(playbackVolume(1), PLAYBACK_CEILING);
    assert.equal(playbackVolume(5), PLAYBACK_CEILING, 'over-unity is clamped');
    assert.equal(playbackVolume(Number.POSITIVE_INFINITY), PLAYBACK_CEILING);
    assert.equal(playbackVolume(0.5), PLAYBACK_CEILING * 0.5);
    assert.equal(playbackVolume(0), 0);
    assert.equal(playbackVolume(-3), 0, 'negative is floored, never phase-inverted');
    assert.equal(playbackVolume(Number.NaN), PLAYBACK_CEILING, 'unreadable falls back to the ceiling');
  });

  it('sets the volume on a player, and survives one that cannot take it', () => {
    const player: { volume?: number } = {};
    applyCeiling(player);
    assert.equal(player.volume, PLAYBACK_CEILING);

    applyCeiling(player, 0.25);
    assert.equal(player.volume, PLAYBACK_CEILING * 0.25);

    // A released player, or a build whose expo-audio has no `volume`. Failing to
    // set the ceiling must not take playback down with it.
    const hostile = {
      set volume(_v: number) {
        throw new Error('player released');
      },
    };
    assert.doesNotThrow(() => applyCeiling(hostile));
    assert.doesNotThrow(() => applyCeiling(null));
  });

  it('is actually applied by both file players', () => {
    // A ceiling nothing calls is decoration. This asserts the wiring, because
    // the failure mode is silent: playback simply gets loud again.
    for (const f of ['src/features/ear/earPlayer.ts', 'src/features/lab/LabAudioPlayer.ts']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      assert.ok(src.includes('applyCeiling('), `${f} must apply the output ceiling`);
    }
  });
});

describe('the Sound Safety warning text', () => {
  it('carries the line that prevents the actual injury', () => {
    // The single most important sentence in the warning: people turn a tone up
    // because they cannot hear it, which is exactly when it is most dangerous.
    const line = SOUND_SAFETY_STEPS.find((s) => s.includes('difficult'));
    assert.ok(line, 'the "do not raise it because you cannot hear it" step must survive edits');
    assert.match(line!, /impossible/);
  });

  it('tells the user what the app does for them, not only what they must do', () => {
    assert.ok(SOUND_SAFETY_PROTECTIONS.length >= 4);
    const all = SOUND_SAFETY_PROTECTIONS.join(' ').toLowerCase();
    // CHANGED 2026-09-20 (copy pass 2 F56). It used to require the word
    // "shake" alone. Shake-to-mute degrades silently where the accelerometer
    // is unavailable, so the ALWAYS-available route — tapping the audio row —
    // is now what the acknowledgment leads with, and is what must be stated.
    assert.ok(all.includes('tap'), 'the always-available mute must be stated before it is needed');
    assert.ok(all.includes('shaking'), 'the shake gesture is still worth naming, as a second route');
    assert.ok(all.includes('off every time'), 'muted-by-default is a protection worth stating');
  });

  it('the recorded text is the text that was shown', () => {
    // The record exists to answer "what did it say". If the full text could
    // drift from the rendered constants, the record would be worthless.
    const full = soundSafetyFullText();
    for (const step of SOUND_SAFETY_STEPS) assert.ok(full.includes(step), step.slice(0, 30));
    for (const p of SOUND_SAFETY_PROTECTIONS) assert.ok(full.includes(p), p.slice(0, 30));
    assert.ok(full.includes(SOUND_SAFETY_ACK), 'the acknowledgment itself must be in the record');
    assert.ok(full.length > 900, 'a short "full text" means something stopped being included');
  });
});

describe('the Sound Safety gate is wired so it cannot be passed by accident', () => {
  const gate = readFileSync(
    new URL('../src/features/audio/AudioOutputGate.tsx', import.meta.url),
    'utf8',
  );
  const warning = readFileSync(
    new URL('../src/features/audio/SoundSafetyWarning.tsx', import.meta.url),
    'utf8',
  );

  it('the warning is the FIRST phase, before the per-session enable', () => {
    assert.match(gate, /setPhase\(isAcknowledged\(\) \? 'explain' : 'safety'\)/);
  });

  it('a failed record does NOT enable sound', () => {
    // An acknowledgment nobody wrote down did not happen.
    assert.match(gate, /if \(!stored\) \{\s*settle\(false\);/);
  });

  it('the accept button is disabled until the box is ticked', () => {
    assert.match(warning, /disabled=\{!checked\}/);
    // And the handler refuses too, so a styled-only "disabled" cannot fire.
    assert.match(warning, /if \(!checked\) return;/);
  });

  it('the checkbox starts unticked and resets on every close', () => {
    assert.match(warning, /useState\(false\)/);
    assert.match(warning, /setChecked\(false\);\s*\n\s*onDecline\(\)/);
  });

  it('dismissing is not accepting', () => {
    // The scrim and the hardware back key must both decline, not accept.
    assert.match(warning, /onRequestClose=\{close\}/);
    assert.match(warning, /onPress=\{close\}[\s\S]{0,200}Close without enabling sound/);
  });
});
