/**
 * The silencing path must actually reach FILE playback.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * On 2026-09-17 an audit of the audio system found that neither of the app's
 * two ways to silence itself could stop a playing file. `panicMuteAudio()` —
 * the shake gesture — stopped the native generator, the binaural bus, the
 * modular voice and text-to-speech, and nothing else; `disableAudioOutput()`
 * flipped a boolean. Meanwhile the Sound Safety Warning, which the learner must
 * accept before any sound is allowed, PROMISES IN WRITING that shaking the
 * phone mutes everything instantly.
 *
 * A safety control that does not do what its own warning text says is worse
 * than no control, because the user stops reaching for the hardware volume.
 *
 * The fix was a registry every live player is adopted into. The registry is
 * what is tested here: the wiring at the far end (panicMute, audioOutputStore)
 * is a one-line call each, but the registry has to survive a released handle,
 * a player that throws, and double registration — because every one of those
 * happens in normal use, and any of them silently eating the loop would
 * recreate the original bug with a registry in place to hide it.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { beforeEach, describe, it } from 'node:test';
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

const {
  registerFilePlayer,
  unregisterFilePlayer,
  stopAllFilePlayers,
  liveFilePlayerCount,
  __resetFilePlayersForTests,
} = await import('../src/features/audio/filePlayers.ts');

const { applyCeiling, PLAYBACK_CEILING } = await import('../src/features/audio/outputCeiling.ts');

/** A stand-in for an expo-audio player, recording what was done to it. */
function fakePlayer(opts: { throwOnPause?: boolean } = {}) {
  return {
    playing: true,
    volume: 1,
    paused: 0,
    pause() {
      if (opts.throwOnPause) throw new Error('player released');
      this.paused += 1;
      this.playing = false;
    },
  };
}

describe('file players can be silenced', () => {
  beforeEach(() => __resetFilePlayersForTests());

  it('a registered player is paused', () => {
    const p = fakePlayer();
    registerFilePlayer(p);
    assert.equal(stopAllFilePlayers(), 1);
    assert.equal(p.paused, 1);
    assert.equal(p.playing, false);
  });

  it('stopping does NOT touch the volume — nothing would ever restore it', () => {
    // Regression guard. The first version of this also set `volume = 0` as belt
    // and braces. Nothing ever set it back: the ceiling is applied on the CREATE
    // branch of all three player owners and expo-audio's volume survives
    // `replace()`, so a shake-mute or a 20-minute idle auto-mute left the next
    // clip playing silently with its progress bar moving. Silence that outlives
    // the mute is a bug, not extra safety.
    const p = fakePlayer();
    p.volume = 0.25;
    registerFilePlayer(p);
    stopAllFilePlayers();
    assert.equal(p.volume, 0.25);
  });

  it('EVERY player is stopped even when one of them throws', () => {
    // The original bug was a silence path that missed players. A dead handle in
    // the middle of the set must not be able to recreate it for the rest.
    const before = fakePlayer();
    const dead = fakePlayer({ throwOnPause: true });
    const after = fakePlayer();
    [before, dead, after].forEach(registerFilePlayer);

    assert.equal(stopAllFilePlayers(), 2);
    assert.equal(before.paused, 1);
    assert.equal(after.paused, 1);
    // The thrower is forgotten rather than retried forever.
    assert.equal(liveFilePlayerCount(), 2);
  });

  it('an unregistered player is left alone', () => {
    const p = fakePlayer();
    registerFilePlayer(p);
    unregisterFilePlayer(p);
    assert.equal(stopAllFilePlayers(), 0);
    assert.equal(p.paused, 0);
  });

  it('registering twice stops once — release sites unregister exactly one handle', () => {
    const p = fakePlayer();
    registerFilePlayer(p);
    registerFilePlayer(p);
    assert.equal(liveFilePlayerCount(), 1);
    assert.equal(stopAllFilePlayers(), 1);
  });

  it('null and undefined are tolerated on both sides', () => {
    // Call sites pass `this.player`, which is legitimately null before load and
    // after dispose; a throw there would take down the dispose path.
    registerFilePlayer(null);
    registerFilePlayer(undefined);
    unregisterFilePlayer(null);
    assert.equal(liveFilePlayerCount(), 0);
  });

  it('applying the ceiling ADOPTS the player — the two are one act', () => {
    // This is the coupling that closes the hole: the bug was that registration
    // was a second call somebody had to remember. If these are ever pulled
    // apart, the shake gesture goes quietly back to missing file playback.
    const p = fakePlayer();
    applyCeiling(p);
    assert.equal(p.volume, PLAYBACK_CEILING);
    assert.equal(liveFilePlayerCount(), 1);
    assert.equal(stopAllFilePlayers(), 1);
  });

  it('a player with no volume property is still stopped', () => {
    // Older expo-audio builds do not expose `volume`; failing to set it must
    // not skip the pause.
    const p: { paused: number; pause: () => void } = { paused: 0, pause() { this.paused += 1; } };
    registerFilePlayer(p);
    assert.equal(stopAllFilePlayers(), 1);
    assert.equal(p.paused, 1);
  });
});
